/**
 * The column contract for the bulk product spreadsheet — shared by the export
 * writer and the import parser so the two can never drift.
 *
 * Adding a field later (sellingPrice, active, …) is a three-step change:
 *   1. add an entry to BULK_FIELDS with its headers + aliases,
 *   2. emit it in product-bulk-export.service.ts,
 *   3. stage + apply it in product-bulk-import.service.ts.
 * Everything else here (header matching, normalisation, CSV escaping) is
 * field-agnostic and needs no change.
 */

/** The SKU column is the join key and is always required on import. */
export const SKU_COLUMN = 'sku';

export interface BulkFieldSpec {
  /** Headers this field owns, in export order. */
  readonly columns: readonly string[];
  /**
   * Headers an import must supply to touch this field. A column in `columns`
   * but not here is informational on export and ignored on import.
   */
  readonly required: readonly string[];
}

export const BULK_FIELDS = {
  categories: {
    columns: ['categoryL1', 'categoryL2', 'categoryL3', 'categorySlug'],
    required: ['categoryL1', 'categoryL2', 'categoryL3'],
  },
} as const satisfies Record<string, BulkFieldSpec>;

/** Full export header row, in order. */
export const EXPORT_COLUMNS: readonly string[] = [
  SKU_COLUMN,
  'name',
  ...BULK_FIELDS.categories.columns,
];

/**
 * Accepted spellings per canonical column. Matching is done on the *normalised*
 * header (lowercased, non-alphanumerics stripped), so "Website Category L1",
 * "website_category_l1" and "categoryL1" all land on `categoryL1`.
 *
 * The "website category" spellings are deliberate: they let a sheet produced by
 * the client's own product-sorting workbook import without being re-headered.
 */
const HEADER_ALIASES: Record<string, readonly string[]> = {
  [SKU_COLUMN]: ['sku', 'productsku', 'websitesku', 'ebsku'],
  name: ['name', 'productname', 'title'],
  categoryL1: ['categoryl1', 'websitecategoryl1', 'l1', 'category1', 'maincategory'],
  categoryL2: ['categoryl2', 'websitecategoryl2', 'l2', 'category2', 'subcategory'],
  categoryL3: ['categoryl3', 'websitecategoryl3', 'l3', 'category3', 'subsubcategory'],
  categorySlug: ['categoryslug', 'categoryslugs', 'slug'],
};

/** Lowercase and drop everything that isn't a letter or digit. */
export function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Map a file's header row onto canonical column names. Unrecognised headers
 * map to null so extra columns in the sheet are simply carried past.
 */
export function mapHeaders(headers: readonly string[]): (string | null)[] {
  const lookup = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) lookup.set(alias, canonical);
  }
  const seen = new Set<string>();
  return headers.map((h) => {
    const canonical = lookup.get(normalizeHeader(h ?? ''));
    // A duplicated column would silently shadow the first; keep the first only.
    if (!canonical || seen.has(canonical)) return null;
    seen.add(canonical);
    return canonical;
  });
}

/**
 * Trim and collapse internal whitespace. Applied to every staged cell so that
 * "Bags " and "Bags" are the same category — the client's sheets carry trailing
 * spaces on a good number of category names.
 */
export function normalizeCell(raw: string | undefined | null): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * URL slug for a category name. Must stay identical to the slugs already in the
 * catalogue: "&" becomes "and" rather than being dropped, so "USB & Tech" is
 * `usb-and-tech`, not `usb-tech`.
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** RFC 4180 field escaping. */
export function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function csvRow(cells: readonly string[]): string {
  return cells.map(csvCell).join(',') + '\r\n';
}
