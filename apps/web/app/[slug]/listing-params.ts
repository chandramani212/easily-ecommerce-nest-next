/**
 * URL <-> query mapping for server-paged category listings. Shared by the
 * server page (parse) and the client listing (build) so both agree on the
 * parameter names: `?page=&sort=&min=&max=&brand=&color=`.
 */

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

/** Products shown per page. */
export const PER_PAGE = 45;

export interface ListingQuery {
  page: number;
  sort: SortKey;
  minPrice?: number;
  maxPrice?: number;
  /** Brand attribute values, as shown on the brand checkboxes. */
  brands: string[];
  /** Color family labels, as shown on the color chips (e.g. "Blue"). */
  colors: string[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined): string[] {
  return (Array.isArray(v) ? v : v ? [v] : [])
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === undefined || s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function parseListingQuery(
  sp: RawSearchParams,
  defaultSort: SortKey,
): ListingQuery {
  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortKey)
    : defaultSort;
  return {
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
    sort,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    brands: list(sp.brand),
    colors: list(sp.color),
  };
}

/** Shareable page query for a listing state; defaults are omitted. */
export function listingSearchParams(
  q: ListingQuery,
  defaultSort: SortKey,
): URLSearchParams {
  const p = new URLSearchParams();
  if (q.sort !== defaultSort) p.set("sort", q.sort);
  if (q.minPrice !== undefined) p.set("min", String(q.minPrice));
  if (q.maxPrice !== undefined) p.set("max", String(q.maxPrice));
  for (const b of q.brands) p.append("brand", b);
  for (const c of q.colors) p.append("color", c);
  if (q.page > 1) p.set("page", String(q.page));
  return p;
}
