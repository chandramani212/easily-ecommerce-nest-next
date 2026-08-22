import { Injectable, Logger } from '@nestjs/common';
import type { Writable } from 'node:stream';

import { PrismaService } from '../../prisma/prisma.service';
import { EXPORT_COLUMNS, csvRow, normalizeCell } from './bulk-columns';

/** Products fetched (and written) per round trip. */
const BATCH_SIZE = 5_000;

interface ProductBatchRow {
  sku: string;
  name: string;
  cats: string[];
}

/** A category's position in the tree, precomputed once per export. */
interface CategoryPath {
  slug: string;
  l1: string;
  l2: string;
  l3: string;
  /** Sort key used to pick a product's primary category deterministically. */
  order: string;
}

@Injectable()
export class ProductBulkExportService {
  private readonly log = new Logger(ProductBulkExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stream every product as CSV into `out`.
   *
   * Deliberately never materialises the catalogue: categories (a few hundred
   * rows) are loaded once into a path lookup, then products are walked by
   * keyset pagination on `sku` and written batch by batch. Memory stays flat
   * regardless of catalogue size — the reason this exists alongside the legacy
   * /products/export, which hydrates all 130k products and their relations into
   * one string and falls over.
   */
  async streamCsv(out: Writable): Promise<number> {
    const paths = await this.loadCategoryPaths();

    await this.write(out, '﻿'); // BOM: Excel opens UTF-8 correctly
    await this.write(out, csvRow(EXPORT_COLUMNS));

    let cursor = '';
    let written = 0;

    for (;;) {
      const batch = await this.prisma.$queryRaw<ProductBatchRow[]>`
        SELECT p.sku,
               p.name,
               COALESCE(
                 array_agg(pc."A") FILTER (WHERE pc."A" IS NOT NULL),
                 '{}'
               ) AS cats
        FROM "Product" p
        LEFT JOIN "_ProductCategories" pc ON pc."B" = p.id
        WHERE p.sku > ${cursor}
        GROUP BY p.sku, p.name
        ORDER BY p.sku
        LIMIT ${BATCH_SIZE}`;

      if (batch.length === 0) break;

      let chunk = '';
      for (const row of batch) {
        const assigned = row.cats
          .map((id) => paths.get(id))
          .filter((p): p is CategoryPath => Boolean(p));
        // Deepest-then-lowest-sortOrder wins as the primary path, so a product
        // sitting on both a leaf and its ancestor still exports the leaf.
        const primary = [...assigned].sort((a, b) =>
          a.order.localeCompare(b.order),
        )[0];

        chunk += csvRow([
          row.sku,
          // Collapse embedded newlines: `name` is informational here, and
          // keeping one record per physical line means the row numbers in an
          // import report line up with the spreadsheet's own row numbers.
          normalizeCell(row.name),
          primary?.l1 ?? '',
          primary?.l2 ?? '',
          primary?.l3 ?? '',
          assigned
            .map((p) => p.slug)
            .sort()
            .join('|'),
        ]);
      }

      await this.write(out, chunk);
      written += batch.length;
      cursor = batch[batch.length - 1]!.sku;

      if (batch.length < BATCH_SIZE) break;
    }

    this.log.log(`Exported ${written} products.`);
    return written;
  }

  /**
   * Build id → {l1,l2,l3,slug} for every category by walking parents. The tree
   * is only a few hundred rows, so one query beats a join per product.
   */
  private async loadCategoryPaths(): Promise<Map<string, CategoryPath>> {
    const cats = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        sortOrder: true,
      },
    });
    const byId = new Map(cats.map((c) => [c.id, c]));

    const paths = new Map<string, CategoryPath>();
    for (const cat of cats) {
      const chain: typeof cats = [];
      let node: (typeof cats)[number] | undefined = cat;
      // Guard against a cycle: a self-referencing tree would otherwise hang.
      const guard = new Set<string>();
      while (node && !guard.has(node.id)) {
        guard.add(node.id);
        chain.unshift(node);
        node = node.parentId ? byId.get(node.parentId) : undefined;
      }
      paths.set(cat.id, {
        slug: cat.slug,
        l1: chain[0]?.name ?? '',
        l2: chain[1]?.name ?? '',
        l3: chain[2]?.name ?? '',
        // Deeper first (so a leaf outranks its parent), then by sortOrder.
        order: `${9 - Math.min(chain.length, 9)}${String(cat.sortOrder).padStart(6, '0')}${cat.name}`,
      });
    }
    return paths;
  }

  /** Write honouring backpressure so a slow client can't balloon memory. */
  private write(out: Writable, chunk: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ok = out.write(chunk, (err) => {
        if (err) reject(err);
      });
      if (ok) resolve();
      else out.once('drain', resolve);
    });
  }
}
