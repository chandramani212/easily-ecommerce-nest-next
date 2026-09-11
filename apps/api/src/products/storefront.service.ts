import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Storefront category listing: one page of lean product cards, filtered,
 * sorted and paged in the database, plus category-wide filter options.
 * Served on sibling routes of `GET /products` (which the admin depends on).
 */

export type StorefrontSort =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating';

const SORTS: readonly StorefrontSort[] = [
  'featured',
  'price-asc',
  'price-desc',
  'newest',
  'rating',
];

/** Raw query string. Parsed here — the global ValidationPipe skips interfaces. */
export interface StorefrontListQuery {
  categoryId?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  /** Brand attribute values (repeatable). */
  brand?: string | string[];
  /** Individual color names, case-insensitive (repeatable). */
  color?: string | string[];
}

export interface StorefrontFacets {
  /** Active products in the category. */
  count: number;
  priceMin: number;
  priceMax: number;
  brands: { value: string; count: number }[];
  /** Individual color names, lowercased; multi-color values are split. */
  colors: { value: string; count: number }[];
}

interface FacetIndex {
  facets: StorefrontFacets;
  /** Product ids per brand value / color name, for id-list filtering. */
  brandIds: Map<string, string[]>;
  colorIds: Map<string, string[]>;
}

interface CardRow {
  id: string;
  slug: string;
  name: string;
  sellingPrice: Prisma.Decimal;
  basePrice: Prisma.Decimal;
  images: string[] | null;
  attributes: unknown;
  createdAt: Date;
}

const DEFAULT_PAGE_SIZE = 45;
const MAX_PAGE_SIZE = 100;

// Facets need a scan of the category's attribute JSON (~200 ms on the largest
// category), so they're kept in memory: fresh for 5 minutes, then served stale
// for up to an hour while a single background refresh runs.
const FACET_FRESH_MS = 5 * 60_000;
const FACET_STALE_MS = 60 * 60_000;
const FACET_CACHE_MAX = 200;

/** Same splitting as the web's `splitColors`: , / | and hyphens between word chars. */
const COLOR_SPLIT = /[,/|]|(?<=\w)-(?=\w)/;

/** Card price: the selling price, or the base price when none is set. */
const PRICE = Prisma.sql`COALESCE(NULLIF(p."sellingPrice", 0), p."basePrice")`;

const FROM = Prisma.sql`"_ProductCategories" pc JOIN "Product" p ON p.id = pc."B"`;

const ORDER_BY: Record<StorefrontSort, Prisma.Sql> = {
  'price-asc': Prisma.sql`${PRICE} ASC, p.id ASC`,
  'price-desc': Prisma.sql`${PRICE} DESC, p.id ASC`,
  newest: Prisma.sql`p."createdAt" DESC, p.id ASC`,
  // There are no stored ratings yet (every card shows 4 stars), so "Top Rated"
  // keeps the same catalog order as "Featured": newest first.
  featured: Prisma.sql`p."createdAt" DESC, p.id ASC`,
  rating: Prisma.sql`p."createdAt" DESC, p.id ASC`,
};

const CARD_ATTRIBUTES = new Set(['brand', 'color', 'colour']);

function requireCategory(categoryId?: string): string {
  if (!categoryId?.trim()) {
    throw new BadRequestException('categoryId is required');
  }
  return categoryId;
}

function toNum(v?: string): number | undefined {
  if (v === undefined || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toList(v?: string | string[]): string[] {
  return (Array.isArray(v) ? v : v === undefined ? [] : [v]).filter(
    (s) => s.trim() !== '',
  );
}

function pushTo(map: Map<string, string[]>, key: string, id: string) {
  const ids = map.get(key);
  if (ids) ids.push(id);
  else map.set(key, [id]);
}

function countsOf(map: Map<string, string[]>) {
  return [...map]
    .map(([value, ids]) => ({ value, count: ids.length }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Only what a product card needs; attributes trimmed to brand/color. */
function toCard(r: CardRow) {
  const attributes = Array.isArray(r.attributes)
    ? (r.attributes as unknown[]).filter(
        (a): a is { name: string; value: string } => {
          const attr = a as { name?: unknown; value?: unknown } | null;
          return (
            typeof attr?.name === 'string' &&
            typeof attr.value === 'string' &&
            CARD_ATTRIBUTES.has(attr.name.toLowerCase())
          );
        },
      )
    : [];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    sellingPrice: r.sellingPrice,
    basePrice: r.basePrice,
    images: r.images ?? [],
    attributes,
    createdAt: r.createdAt,
  };
}

@Injectable()
export class ProductsStorefrontService {
  private readonly facetCache = new Map<string, { index: FacetIndex; at: number }>();
  private readonly facetInflight = new Map<string, Promise<FacetIndex>>();

  constructor(private readonly prisma: PrismaService) {}

  async facets(categoryId?: string): Promise<StorefrontFacets> {
    return (await this.facetIndex(requireCategory(categoryId))).facets;
  }

  async list(query: StorefrontListQuery) {
    const categoryId = requireCategory(query.categoryId);
    const page = Math.max(1, Math.floor(toNum(query.page) ?? 1));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.floor(toNum(query.pageSize) ?? DEFAULT_PAGE_SIZE)),
    );
    const sort = SORTS.includes(query.sort as StorefrontSort)
      ? (query.sort as StorefrontSort)
      : 'featured';
    const minPrice = toNum(query.minPrice);
    const maxPrice = toNum(query.maxPrice);
    const brands = toList(query.brand);
    const colors = toList(query.color).map((c) => c.trim().toLowerCase());

    const conds: Prisma.Sql[] = [
      Prisma.sql`pc."A" = ${categoryId}`,
      Prisma.sql`p.active = true`,
    ];
    if (minPrice !== undefined) conds.push(Prisma.sql`${PRICE} >= ${minPrice}::numeric`);
    if (maxPrice !== undefined) conds.push(Prisma.sql`${PRICE} <= ${maxPrice}::numeric`);

    // Brand and color live in the attributes JSON. Filter through the cached
    // per-category id index instead of re-scanning JSON for every page.
    if (brands.length || colors.length) {
      const index = await this.facetIndex(categoryId);
      for (const [selected, byValue] of [
        [brands, index.brandIds],
        [colors, index.colorIds],
      ] as const) {
        if (!selected.length) continue;
        const ids = [...new Set(selected.flatMap((v) => byValue.get(v) ?? []))];
        if (!ids.length) {
          return { items: [], total: 0, page, pageSize, pageCount: 0 };
        }
        conds.push(Prisma.sql`p.id = ANY(${ids}::text[])`);
      }
    }

    const where = Prisma.join(conds, ' AND ');
    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT count(*)::int AS n FROM ${FROM} WHERE ${where}`,
      this.prisma.$queryRaw<CardRow[]>`
        SELECT p.id, p.slug, p.name, p."sellingPrice", p."basePrice",
               p.images[1:1] AS images, p.attributes, p."createdAt"
        FROM ${FROM}
        WHERE ${where}
        ORDER BY ${ORDER_BY[sort]}
        LIMIT ${pageSize}::int OFFSET ${(page - 1) * pageSize}::int`,
    ]);

    const total = countRows[0]?.n ?? 0;
    return {
      items: rows.map(toCard),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  /** Cached facet index for a category (see FACET_FRESH_MS / FACET_STALE_MS). */
  private facetIndex(categoryId: string): Promise<FacetIndex> {
    const hit = this.facetCache.get(categoryId);
    const age = hit ? Date.now() - hit.at : Infinity;
    if (hit && age < FACET_FRESH_MS) return Promise.resolve(hit.index);

    const refresh = this.refreshFacets(categoryId);
    if (hit && age < FACET_STALE_MS) {
      refresh.catch(() => undefined); // keep serving the stale copy on failure
      return Promise.resolve(hit.index);
    }
    return refresh;
  }

  /** One computation per category at a time; the result replaces the cache entry. */
  private refreshFacets(categoryId: string): Promise<FacetIndex> {
    let pending = this.facetInflight.get(categoryId);
    if (!pending) {
      pending = this.computeFacets(categoryId)
        .then((index) => {
          this.facetCache.delete(categoryId); // re-insert as most recent
          this.facetCache.set(categoryId, { index, at: Date.now() });
          while (this.facetCache.size > FACET_CACHE_MAX) {
            const oldest = this.facetCache.keys().next().value;
            if (oldest === undefined) break;
            this.facetCache.delete(oldest);
          }
          return index;
        })
        .finally(() => this.facetInflight.delete(categoryId));
      this.facetInflight.set(categoryId, pending);
    }
    return pending;
  }

  private async computeFacets(categoryId: string): Promise<FacetIndex> {
    const [stats, attrRows] = await Promise.all([
      this.prisma.$queryRaw<
        { n: number; lo: Prisma.Decimal | null; hi: Prisma.Decimal | null }[]
      >`
        SELECT count(*)::int AS n, min(${PRICE}) AS lo, max(${PRICE}) AS hi
        FROM ${FROM}
        WHERE pc."A" = ${categoryId} AND p.active = true`,
      this.prisma.$queryRaw<{ id: string; name: string; value: string }[]>`
        SELECT p.id, lower(e.elem->>'name') AS name, e.elem->>'value' AS value
        FROM ${FROM}
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(p.attributes) = 'array'
               THEN p.attributes ELSE '[]'::jsonb END
        ) WITH ORDINALITY AS e(elem, ord)
        WHERE pc."A" = ${categoryId} AND p.active = true
          AND lower(e.elem->>'name') IN ('brand', 'color', 'colour')
          AND jsonb_typeof(e.elem->'value') = 'string'
        ORDER BY p.id, e.ord`,
    ]);

    // Mirror the storefront card: the first "brand" attribute, and the first
    // "color" attribute (falling back to "colour").
    const perProduct = new Map<string, Partial<Record<string, string>>>();
    for (const r of attrRows) {
      const attrs = perProduct.get(r.id) ?? {};
      if (attrs[r.name] === undefined) attrs[r.name] = r.value;
      perProduct.set(r.id, attrs);
    }

    const brandIds = new Map<string, string[]>();
    const colorIds = new Map<string, string[]>();
    for (const [id, attrs] of perProduct) {
      if (attrs.brand) pushTo(brandIds, attrs.brand, id);
      const raw = attrs.color ?? attrs.colour;
      if (!raw) continue;
      const seen = new Set<string>();
      for (const part of raw.split(COLOR_SPLIT)) {
        const color = part.trim().toLowerCase();
        if (color && !seen.has(color)) {
          seen.add(color);
          pushTo(colorIds, color, id);
        }
      }
    }

    const s = stats[0];
    return {
      facets: {
        count: s?.n ?? 0,
        priceMin: Number(s?.lo ?? 0),
        priceMax: Number(s?.hi ?? 0),
        brands: countsOf(brandIds),
        colors: countsOf(colorIds),
      },
      brandIds,
      colorIds,
    };
  }
}
