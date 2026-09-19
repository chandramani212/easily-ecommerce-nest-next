/**
 * Column contract for the full product spreadsheet (every editable field,
 * source categories excluded). Shared by the export writer, the import parser
 * and the admin's field picker (served from GET /products/bulk/fields) so the
 * three can never drift.
 *
 * Deliberately NOT part of the sheet (a column for them is ignored on import):
 * product images (managed in the product editor), the supplier SKU, and
 * categories beyond the main one (e.g. Best Sellers links, kept as they are).
 *
 * Fields are exported in groups: picking "Prices" in the admin writes both
 * basePrice and sellingPrice. `sku` is always the first column — it is the key
 * an imported row is matched on.
 */
import { normalizeHeader } from './bulk-columns';

/** Quantity-price slots exported as tierNQty / tierNPrice column pairs. */
export const TIER_SLOTS = 6;

export const tierQtyCol = (n: number) => `tier${n}Qty`;
export const tierPriceCol = (n: number) => `tier${n}Price`;

/** Separator for multi-value cells (attributes, related SKUs). */
export const LIST_SEP = '|';

export interface ProductFieldGroup {
  key: string;
  label: string;
  columns: readonly string[];
}

export const PRODUCT_FIELD_GROUPS: readonly ProductFieldGroup[] = [
  { key: 'name', label: 'Name', columns: ['name'] },
  { key: 'slug', label: 'URL slug', columns: ['slug'] },
  { key: 'active', label: 'Status (active)', columns: ['active'] },
  { key: 'prices', label: 'Prices', columns: ['basePrice', 'sellingPrice'] },
  {
    key: 'tiers',
    label: 'Quantity prices',
    columns: Array.from({ length: TIER_SLOTS }, (_, i) => [
      tierQtyCol(i + 1),
      tierPriceCol(i + 1),
    ]).flat(),
  },
  { key: 'shortDescription', label: 'Short description', columns: ['shortDescription'] },
  { key: 'description', label: 'Description', columns: ['description'] },
  { key: 'attributes', label: 'Attributes (color…)', columns: ['attributes'] },
  {
    key: 'categories',
    label: 'Categories',
    columns: ['categoryL1', 'categoryL2', 'categoryL3'],
  },
  { key: 'related', label: 'Related products', columns: ['relatedSkus'] },
  {
    key: 'seo',
    label: 'SEO',
    columns: ['metaTitle', 'metaDescription', 'keywords', 'ogImage'],
  },
];

export const ALL_GROUP_KEYS = PRODUCT_FIELD_GROUPS.map((g) => g.key);

/** Header row for the chosen groups (unknown keys ignored), sku first. */
export function exportColumns(groupKeys: readonly string[]): string[] {
  const wanted = new Set(groupKeys);
  return [
    'sku',
    ...PRODUCT_FIELD_GROUPS.filter((g) => wanted.has(g.key)).flatMap(
      (g) => g.columns,
    ),
  ];
}

/**
 * Every column an import understands, keyed by normalised header. Tier columns
 * are matched by pattern (see mapProductHeaders) so a sheet may carry more or
 * fewer slots than an export writes.
 */
const KNOWN = new Map<string, string>(
  ['sku', ...PRODUCT_FIELD_GROUPS.flatMap((g) => g.columns)]
    .filter((c) => !/^tier\d+/.test(c))
    .map((c) => [normalizeHeader(c), c]),
);
// A few friendlier spellings people type by hand.
for (const [alias, col] of [
  ['productsku', 'sku'],
  ['productname', 'name'],
  ['title', 'name'],
  ['status', 'active'],
  ['price', 'sellingPrice'],
  ['relatedproducts', 'relatedSkus'],
] as const) {
  KNOWN.set(normalizeHeader(alias), col);
}

/** Upper bound on tier slots an import will read (qty must be unique anyway). */
export const MAX_IMPORT_TIERS = 20;

/**
 * Map a file's header row onto canonical column names; unknown headers map to
 * null and are ignored. A repeated column keeps its first occurrence only.
 */
export function mapProductHeaders(headers: readonly string[]): (string | null)[] {
  const seen = new Set<string>();
  return headers.map((h) => {
    const norm = normalizeHeader(h ?? '');
    const tier = /^tier(\d+)(qty|price)$/.exec(norm);
    let col: string | null = null;
    if (tier) {
      const n = Number(tier[1]);
      if (n >= 1 && n <= MAX_IMPORT_TIERS) {
        col = tier[2] === 'qty' ? tierQtyCol(n) : tierPriceCol(n);
      }
    } else {
      col = KNOWN.get(norm) ?? null;
    }
    if (!col || seen.has(col)) return null;
    seen.add(col);
    return col;
  });
}

/** Split a multi-value cell on LIST_SEP, trimming and dropping blanks. */
export function splitList(cell: string): string[] {
  return cell
    .split(LIST_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}
