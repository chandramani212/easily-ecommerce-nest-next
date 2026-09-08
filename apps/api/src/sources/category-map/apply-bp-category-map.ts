/**
 * Replaces the storefront taxonomy with the BP category hierarchy and files
 * every product under the single most relevant leaf of it.
 *
 * Phases:
 *   1. Validate every asiMap target is a real leaf of bpTree.
 *   2. Purge curated categories that are not part of bpTree.
 *   3. Upsert the BP tree (parents first, so parentId FKs resolve).
 *   4. Link SourceCategory rows to their BP leaf (SourceCategory.categoryId),
 *      matching on the source category's NAME PATH ("Awards > Crystal", falling
 *      back to "Awards" so children inherit the parent's mapping).
 *   5. Classify every product onto exactly ONE BP leaf — source category
 *      first, then product name, then descriptions, then the "Other" ladder
 *      (see bp-product-classifier.ts). No ASI calls, so it is safe to re-run.
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
import { classifyProduct, resolveSourcePath } from './bp-product-classifier';
import { flattenTree, validateSourceMap } from './category-map.util';

const log = new Logger('apply-bp-category-map');
const APPLY = process.argv.includes('--apply');

/** Products read per page while classifying; keeps peak memory flat. */
const READ_PAGE = 5_000;
/** Product↔category rows per INSERT. */
const WRITE_CHUNK = 5_000;

interface ResolvedSourceCategory {
  id: string;
  name: string;
  categoryId: string | null;
  /** "Awards > Crystal", or just "Awards" for a root. */
  path: string;
  /** The root segment, used for the inherit-from-parent fallback. */
  root: string;
  /** BP leaf slug this source category resolves to, if any. */
  slug: string | null;
}

/**
 * Read every source category and resolve it to a BP leaf. Matching is on the
 * NAME PATH rather than externalId because ~8% of SourceCategory.externalId
 * values are generated locally and so differ between environments.
 */
async function loadSourceCategories(
  prisma: PrismaService,
): Promise<ResolvedSourceCategory[]> {
  const rows = await prisma.sourceCategory.findMany({
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
  const byKey = new Map(rows.map((r) => [`${r.sourceId}|${r.externalId}`, r]));
  return rows.map((r) => {
    const parent = r.parentExternalId
      ? byKey.get(`${r.sourceId}|${r.parentExternalId}`)
      : undefined;
    const root = parent?.name ?? r.name;
    const path = parent ? `${parent.name} > ${r.name}` : r.name;
    return {
      id: r.id,
      name: r.name,
      categoryId: r.categoryId,
      path,
      root,
      slug: resolveSourcePath(path, root),
    };
  });
}

interface Assignment {
  productId: string;
  slug: string;
}

interface ClassificationStats {
  byReason: Map<string, number>;
  byLeaf: Map<string, number>;
  /** A few worked examples per reason, for eyeballing the lexicon. */
  samples: Map<string, string[]>;
}

/**
 * Classify the whole catalogue onto exactly one BP leaf per product.
 * Reads products in pages so a 130k-row catalogue never lands in memory at once.
 */
async function classifyCatalogue(
  prisma: PrismaService,
  srcCats: ResolvedSourceCategory[],
): Promise<{ assignments: Assignment[]; stats: ClassificationStats }> {
  const slugByScId = new Map(
    srcCats.filter((s) => s.slug).map((s) => [s.id, s.slug!]),
  );

  // product → the BP leaves its source categories point at.
  const candidates = new Map<string, string[]>();
  const links = await prisma.$queryRaw<{ pid: string; scid: string }[]>`
    SELECT "A" AS pid, "B" AS scid FROM "_ProductSourceCategories"`;
  for (const l of links) {
    const slug = slugByScId.get(l.scid);
    if (!slug) continue;
    const list = candidates.get(l.pid);
    if (!list) candidates.set(l.pid, [slug]);
    else if (!list.includes(slug)) list.push(slug);
  }

  const assignments: Assignment[] = [];
  const stats: ClassificationStats = {
    byReason: new Map(),
    byLeaf: new Map(),
    samples: new Map(),
  };

  let cursor: string | undefined;
  for (;;) {
    const page = await prisma.product.findMany({
      select: { id: true, name: true, shortDescription: true, description: true },
      orderBy: { id: 'asc' },
      take: READ_PAGE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!page.length) break;
    for (const p of page) {
      const result = classifyProduct(p, candidates.get(p.id) ?? []);
      assignments.push({ productId: p.id, slug: result.slug });
      stats.byReason.set(result.reason, (stats.byReason.get(result.reason) ?? 0) + 1);
      stats.byLeaf.set(result.slug, (stats.byLeaf.get(result.slug) ?? 0) + 1);
      const bucket = stats.samples.get(result.reason) ?? [];
      if (bucket.length < 8) {
        bucket.push(
          `${p.name.slice(0, 58)} → ${result.slug}` +
            (result.matchedTerm ? ` ("${result.matchedTerm}")` : ''),
        );
        stats.samples.set(result.reason, bucket);
      }
    }
    cursor = page[page.length - 1].id;
    if (page.length < READ_PAGE) break;
  }

  return { assignments, stats };
}

function reportClassification(stats: ClassificationStats, total: number): void {
  const flat = flattenTree(bpTree);
  // flattenTree emits parents before children, so a single pass builds every
  // "Drinkware > Mugs > Ceramic Mugs" display path.
  const pathBySlug = new Map<string, string>();
  for (const n of flat) {
    const parent = n.parentSlug ? pathBySlug.get(n.parentSlug) : undefined;
    pathBySlug.set(n.slug, parent ? `${parent} > ${n.name}` : n.name);
  }
  const pct = (n: number) => ((n / total) * 100).toFixed(1).padStart(5) + '%';

  log.log(`Classified ${total} products:`);
  const ORDER = ['source', 'source+text', 'text', 'source-other', 'fallback'];
  for (const reason of ORDER) {
    const n = stats.byReason.get(reason) ?? 0;
    if (!n) continue;
    log.log(`  ${reason.padEnd(13)} ${String(n).padStart(7)}  ${pct(n)}`);
    for (const s of stats.samples.get(reason) ?? []) log.log(`      · ${s}`);
  }

  const leaves = flat.filter((n) => n.isLeaf);
  const filled = leaves.filter((n) => stats.byLeaf.has(n.slug));
  log.log(`  leaves used: ${filled.length}/${leaves.length}`);

  // Everything sitting on a catch-all leaf is the review queue: the taxonomy
  // knows the branch but not the shelf. Shrinking these means adding terms to
  // the classifier's LEXICON, not changing the tree.
  const others = leaves
    .filter((n) => n.name === 'Other' && stats.byLeaf.has(n.slug))
    .map((n) => [n.slug, stats.byLeaf.get(n.slug)!] as const)
    .sort((a, b) => b[1] - a[1]);
  const otherTotal = others.reduce((sum, [, n]) => sum + n, 0);
  log.log(`  in catch-all "Other" leaves: ${otherTotal}  ${pct(otherTotal)}`);
  for (const [slug, n] of others.slice(0, 12)) {
    log.log(`    ${String(n).padStart(7)}  ${pathBySlug.get(slug) ?? slug}`);
  }

  const top = [...stats.byLeaf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  log.log('  largest categories:');
  for (const [slug, n] of top) {
    log.log(`    ${String(n).padStart(7)}  ${pathBySlug.get(slug) ?? slug}`);
  }
}

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

      // Run the full classification so the proposed placement of every product
      // can be reviewed before anything is written.
      const srcCatsDry = await loadSourceCategories(prisma);
      const { assignments, stats } = await classifyCatalogue(prisma, srcCatsDry);
      reportClassification(stats, assignments.length);
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
    const srcCats = await loadSourceCategories(prisma);
    const unmappedPaths = new Map<string, number>();
    const skip = new Set(UNMAPPED_ASI);
    let linked = 0;
    let cleared = 0;

    for (const r of srcCats) {
      // A stale mapping from a previous run must not survive a re-run, so
      // unmapped rows are actively cleared rather than skipped.
      const categoryId = r.slug ? idBySlug.get(r.slug)! : null;
      if (categoryId !== r.categoryId) {
        await prisma.sourceCategory.update({
          where: { id: r.id },
          data: { categoryId },
        });
      }
      if (categoryId) linked += 1;
      else {
        cleared += 1;
        if (!skip.has(r.root)) {
          unmappedPaths.set(r.path, (unmappedPaths.get(r.path) ?? 0) + 1);
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

    // ---- Phase 5: classify every product onto exactly one BP leaf ----------
    // Source category first, then product name, then descriptions, then the
    // "Other" ladder. See bp-product-classifier.ts for the scoring rules.
    const { assignments, stats } = await classifyCatalogue(prisma, srcCats);
    reportClassification(stats, assignments.length);

    const dropped = await prisma.$executeRaw`DELETE FROM "_ProductCategories"`;
    let inserted = 0;
    for (let i = 0; i < assignments.length; i += WRITE_CHUNK) {
      const chunk = assignments.slice(i, i + WRITE_CHUNK);
      const catIds = chunk.map((a) => idBySlug.get(a.slug)!);
      const prodIds = chunk.map((a) => a.productId);
      inserted += await prisma.$executeRaw`
        INSERT INTO "_ProductCategories" ("A", "B")
        SELECT * FROM unnest(${catIds}::text[], ${prodIds}::text[])
        ON CONFLICT DO NOTHING`;
    }
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
