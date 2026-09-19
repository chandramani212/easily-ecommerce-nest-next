import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Writable } from 'node:stream';

import { PrismaService } from '../../prisma/prisma.service';
import { csvRow } from './bulk-columns';
import { loadCategoryLookup, primaryOf } from './category-paths';
import { LIST_SEP, exportColumns } from './product-columns';

/** Products fetched (and written) per round trip. Descriptions make rows wide. */
const BATCH_SIZE = 2_000;
/** Rows in a sample file. */
const SAMPLE_ROWS = 3;

interface Row {
  id: string;
  sku: string;
  name: string;
  slug: string;
  active: boolean;
  basePrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  shortDescription: string;
  description: string;
  attributes: unknown;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string | null;
  tiers: { q: number; t: 'FIXED' | 'PERCENTAGE'; p: string }[] | null;
  cats: string[] | null;
  related: string[] | null;
}

/** Decimal / numeric → "12.50". */
const money = (v: Prisma.Decimal | string | number) => Number(v).toFixed(2);

@Injectable()
export class ProductExportService {
  private readonly log = new Logger(ProductExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stream products as CSV with the chosen field groups. Keyset-paginated on
   * `sku` so memory stays flat at any catalogue size. `sample` writes only the
   * first few products — a template showing the exact format.
   */
  async streamCsv(
    out: Writable,
    groups: readonly string[],
    sample = false,
  ): Promise<number> {
    const columns = exportColumns(groups);
    const want = new Set(groups);
    const lookup = want.has('categories')
      ? await loadCategoryLookup(this.prisma)
      : null;

    await this.write(out, '\uFEFF'); // BOM: Excel opens UTF-8 correctly
    await this.write(out, csvRow(columns));

    const limit = sample ? SAMPLE_ROWS : BATCH_SIZE;
    let cursor = '';
    let written = 0;

    for (;;) {
      // Relations are aggregated only when their group was picked.
      const batch = await this.prisma.$queryRaw<Row[]>`
        SELECT p.id, p.sku, p.name, p.slug, p.active,
               p."basePrice", p."sellingPrice", p."shortDescription",
               p.description, p.attributes, p."metaTitle",
               p."metaDescription", p.keywords, p."ogImage",
               ${
                 want.has('tiers')
                   ? Prisma.sql`(SELECT json_agg(json_build_object(
                         'q', t."minQuantity", 't', t.type, 'p', t.price::text)
                       ORDER BY t."minQuantity")
                     FROM "TierPrice" t WHERE t."productId" = p.id)`
                   : Prisma.sql`NULL`
               } AS tiers,
               ${
                 want.has('categories')
                   ? Prisma.sql`(SELECT array_agg(pc."A") FROM "_ProductCategories" pc
                     WHERE pc."B" = p.id)`
                   : Prisma.sql`NULL`
               } AS cats,
               ${
                 want.has('related')
                   ? Prisma.sql`(SELECT array_agg(r.sku ORDER BY r.sku)
                     FROM "_RelatedProducts" rp JOIN "Product" r ON r.id = rp."A"
                     WHERE rp."B" = p.id)`
                   : Prisma.sql`NULL`
               } AS related
        FROM "Product" p
        WHERE p.sku > ${cursor}
        ORDER BY p.sku
        LIMIT ${limit}`;

      if (batch.length === 0) break;

      let chunk = '';
      for (const row of batch) {
        chunk += csvRow(columns.map((c) => this.cell(row, c, lookup)));
      }
      await this.write(out, chunk);
      written += batch.length;
      cursor = batch[batch.length - 1]!.sku;

      if (sample || batch.length < limit) break;
    }

    this.log.log(`Exported ${written} products (${groups.join(',')}).`);
    return written;
  }

  private cell(
    row: Row,
    column: string,
    lookup: Awaited<ReturnType<typeof loadCategoryLookup>> | null,
  ): string {
    const tier = /^tier(\d+)(Qty|Price)$/.exec(column);
    if (tier) {
      const t = row.tiers?.[Number(tier[1]) - 1];
      if (!t) return '';
      if (tier[2] === 'Qty') return String(t.q);
      return t.t === 'PERCENTAGE' ? `${Number(t.p)}%` : money(t.p);
    }

    switch (column) {
      case 'sku':
        return row.sku;
      case 'name':
      case 'slug':
      case 'shortDescription':
      case 'description':
      case 'metaTitle':
      case 'metaDescription':
      case 'keywords':
        return row[column] ?? '';
      case 'ogImage':
        return row.ogImage ?? '';
      case 'active':
        return row.active ? 'true' : 'false';
      case 'basePrice':
        return money(row.basePrice);
      case 'sellingPrice':
        return money(row.sellingPrice);
      case 'attributes':
        return Array.isArray(row.attributes)
          ? (row.attributes as { name?: unknown; value?: unknown }[])
              .filter((a) => typeof a?.name === 'string')
              .map((a) => `${String(a.name)}=${String(a.value ?? '')}`)
              .join(LIST_SEP)
          : '';
      case 'relatedSkus':
        return (row.related ?? []).join(LIST_SEP);
    }

    if (lookup) {
      const primary = primaryOf(row.cats ?? [], lookup);
      switch (column) {
        case 'categoryL1':
          return primary?.names[0] ?? '';
        case 'categoryL2':
          return primary?.names[1] ?? '';
        case 'categoryL3':
          return primary?.names.slice(2).join(' > ') ?? '';
      }
    }
    return '';
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

