/**
 * Replaces the storefront taxonomy with the BP category hierarchy and
 * re-derives every product's categories from its stored source-category links.
 *
 * Phases:
 *   1. Validate every asiMap target is a real leaf of bpTree.
 *   2. Purge curated categories that are not part of bpTree.
 *   3. Upsert the BP tree (parents first, so parentId FKs resolve).
 *   4. Link SourceCategory rows to their BP leaf (SourceCategory.categoryId),
 *      matching on the source category's NAME PATH ("Awards > Crystal", falling
 *      back to "Awards" so children inherit the parent's mapping).
 *   5. Re-derive Product ↔ Category from the durable product↔source-category
 *      links. Pure SQL, no ASI calls — safe to run on production.
 *   6. Deactivate BP categories that hold no products (nothing beneath them
 *      either), so the storefront shows no empty tiles. Admin still sees them.
 *
 * Run:  npm run apply:bp-category-map            (dry run — reports, changes nothing)
 *       npm run apply:bp-category-map -- --apply (writes)
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { bpTree, asiMap, UNMAPPED_ASI } from './bp-category-map.data';
import { flattenTree, validateSourceMap } from './category-map.util';

const log = new Logger('apply-bp-category-map');
const APPLY = process.argv.includes('--apply');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const prisma = app.get(PrismaService);
    const flat = flattenTree(bpTree); // parents before children
    const bpSlugs = [...new Set(flat.map((n) => n.slug))];

    // ---- Phase 1: validate -------------------------------------------------
    const errs = validateSourceMap(bpTree, asiMap);
    if (errs.length) {
      log.error(`Validation failed (${errs.length}):`);
      errs.slice(0, 50).forEach((e) => log.error('  ' + e));
      process.exitCode = 1;
      return;
    }
    log.log(
      `Phase 1: OK — ${flat.length} BP categories, ${Object.keys(asiMap).length} ASI mappings.`,
    );

    if (!APPLY) {
      const doomed = await prisma.category.count({
        where: { slug: { notIn: bpSlugs } },
      });
      const reused = await prisma.category.count({
        where: { slug: { in: bpSlugs } },
      });
      const links = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) AS count FROM "_ProductCategories"`;
      log.warn('DRY RUN — nothing written. Re-run with --apply to execute.');
      log.warn(`  delete ${doomed} existing categories (and their product links)`);
      log.warn(`  keep/update ${reused} whose slug is already part of the BP tree`);
      log.warn(`  create ${flat.length - reused} new categories`);
      log.warn(`  current product↔category links: ${Number(links[0].count)}`);
      return;
    }

    // ---- Phase 2: purge the old taxonomy -----------------------------------
    // Deleting a Category cascades its _ProductCategories join rows and nulls
    // SourceCategory.categoryId (onDelete: SetNull), so this is self-cleaning.
    const purged = await prisma.category.deleteMany({
      where: { slug: { notIn: bpSlugs } },
    });
    log.log(`Phase 2: purged ${purged.count} non-BP categories.`);

    // ---- Phase 3: upsert the BP tree ---------------------------------------
    const idBySlug = new Map<string, string>();
    for (const n of flat) {
      const parentId = n.parentSlug ? idBySlug.get(n.parentSlug) ?? null : null;
      const cat = await prisma.category.upsert({
        where: { slug: n.slug },
        create: {
          slug: n.slug,
          name: n.name,
          sortOrder: n.sortOrder,
          parentId,
          active: true,
        },
        update: { name: n.name, sortOrder: n.sortOrder, parentId },
      });
      idBySlug.set(n.slug, cat.id);
    }
    log.log(`Phase 3: upserted ${idBySlug.size} BP categories.`);

    // ---- Phase 4: link source categories to BP leaves ----------------------
    const srcCats = await prisma.sourceCategory.findMany({
      select: {
        id: true,
        name: true,
        sourceId: true,
        externalId: true,
        parentExternalId: true,
        categoryId: true,
      },
    });
    // (sourceId, externalId) is unique, so a parent resolves unambiguously.
    const byKey = new Map(srcCats.map((r) => [`${r.sourceId}|${r.externalId}`, r]));
    const unmappedPaths = new Map<string, number>();
    const skip = new Set(UNMAPPED_ASI);
    let linked = 0;
    let cleared = 0;

    for (const r of srcCats) {
      const parent = r.parentExternalId
        ? byKey.get(`${r.sourceId}|${r.parentExternalId}`)
        : undefined;
      const root = parent?.name ?? r.name;
      const path = parent ? `${parent.name} > ${r.name}` : r.name;
      const slug = asiMap[path] ?? asiMap[root];
      // A stale mapping from a previous run must not survive a re-run, so
      // unmapped rows are actively cleared rather than skipped.
      const categoryId = slug ? idBySlug.get(slug)! : null;
      if (categoryId !== r.categoryId) {
        await prisma.sourceCategory.update({
          where: { id: r.id },
          data: { categoryId },
        });
      }
      if (categoryId) linked += 1;
      else {
        cleared += 1;
        if (!skip.has(root)) {
          unmappedPaths.set(path, (unmappedPaths.get(path) ?? 0) + 1);
        }
      }
    }
    log.log(
      `Phase 4: linked ${linked}/${srcCats.length} source categories ` +
        `(${cleared} intentionally unmapped).`,
    );
    if (unmappedPaths.size) {
      log.warn(`  ${unmappedPaths.size} path(s) unmapped and not listed in UNMAPPED_ASI:`);
      [...unmappedPaths.keys()].slice(0, 20).forEach((p) => log.warn('    ' + p));
    }

    // ---- Phase 5: re-derive product → category -----------------------------
    // Only products carrying source-category links are touched; anything
    // categorised by hand in the admin (no source links) is left alone.
    const dropped = await prisma.$executeRaw`
      DELETE FROM "_ProductCategories" pc
      USING "Product" p
      WHERE pc."B" = p.id
        AND EXISTS (SELECT 1 FROM "_ProductSourceCategories" ps WHERE ps."A" = p.id)`;
    const inserted = await prisma.$executeRaw`
      INSERT INTO "_ProductCategories" ("A", "B")
      SELECT DISTINCT sc."categoryId", ps."A"
      FROM "_ProductSourceCategories" ps
      JOIN "SourceCategory" sc ON sc.id = ps."B"
      WHERE sc."categoryId" IS NOT NULL
      ON CONFLICT DO NOTHING`;
    log.log(`Phase 5: rebuilt product↔category links (-${dropped}, +${inserted}).`);

    // ---- Phase 6: hide empty categories ------------------------------------
    // A node is non-empty if it, or anything below it, holds a product.
    const toggled = await prisma.$executeRaw`
      WITH RECURSIVE tree AS (
        SELECT id, id AS root FROM "Category"
        UNION ALL
        SELECT c.id, t.root FROM "Category" c JOIN tree t ON c."parentId" = t.id
      ),
      filled AS (
        SELECT DISTINCT t.root AS id
        FROM tree t JOIN "_ProductCategories" pc ON pc."A" = t.id
      )
      UPDATE "Category" c
      SET active = (c.id IN (SELECT id FROM filled))
      WHERE c.active <> (c.id IN (SELECT id FROM filled))`;
    log.log(`Phase 6: toggled active on ${toggled} categories.`);

    const live = await prisma.category.count({ where: { active: true } });
    log.log(`Done. ${live}/${idBySlug.size} BP categories are active.`);
  } finally {
    await app.close();
  }
}

void main();
