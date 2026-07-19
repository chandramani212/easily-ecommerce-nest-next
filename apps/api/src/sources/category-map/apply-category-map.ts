/**
 * Applies the curated category map to the database.
 *
 * Phases:
 *   1. Validate every sourceMap target is a real leaf.
 *   2. Create the used curated categories (mapped leaves + ancestors + Bestsellers).
 *   3. Link SourceCategory rows to their curated leaf (set SourceCategory.categoryId
 *      by matching sourceMap keys — SourceCategory.externalId — on every ASI source).
 *
 * Product → category assignment (the backfill) is a separate, later step.
 *
 * Run:  npm run apply:category-map
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { curatedTree, sourceMap, ALWAYS_CREATE } from './category-map.data';
import {
  flattenTree,
  validateSourceMap,
  usedSlugsToCreate,
} from './category-map.util';

const log = new Logger('apply-category-map');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const prisma = app.get(PrismaService);

    // ---- Phase 1: validate -------------------------------------------------
    const errs = validateSourceMap(curatedTree, sourceMap);
    if (errs.length) {
      log.error(`Validation failed (${errs.length}):`);
      errs.slice(0, 50).forEach((e) => log.error('  ' + e));
      process.exitCode = 1;
      return;
    }
    log.log('Phase 1: validation OK.');

    // ---- Phase 2: create curated categories (prune + alwaysCreate) ---------
    const create = usedSlugsToCreate(curatedTree, sourceMap, ALWAYS_CREATE);
    const flat = flattenTree(curatedTree).filter((n) => create.has(n.slug)); // parents first
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
    log.log(`Phase 2: upserted ${idBySlug.size} curated categories.`);

    // ---- Phase 3: link SourceCategory rows to curated leaves ---------------
    // sourceMap key = SourceCategory.externalId; value = leaf slug. Only ASI
    // sources are touched; existing manual mappings on other rows are untouched.
    const asiSources = await prisma.source.findMany({
      where: { kind: 'ASI_CENTRAL' },
      select: { id: true },
    });
    let linked = 0;
    let missing = 0;
    for (const { id: sourceId } of asiSources) {
      for (const [externalId, slug] of Object.entries(sourceMap)) {
        const categoryId = idBySlug.get(slug);
        if (!categoryId) { missing++; continue; }
        const res = await prisma.sourceCategory.updateMany({
          where: { sourceId, externalId },
          data: { categoryId },
        });
        linked += res.count;
      }
    }
    log.log(
      `Phase 3: linked ${linked} SourceCategory rows across ${asiSources.length} ASI source(s)` +
        (missing ? ` (${missing} slugs missing from created set)` : '') + '.',
    );
    log.log('Done. (Product → category backfill is a separate later step.)');
  } finally {
    await app.close();
  }
}

void main();
