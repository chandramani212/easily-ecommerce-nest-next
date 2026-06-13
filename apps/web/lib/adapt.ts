import { API_URL } from "./api";
import type {
  ApiCategory,
  ApiProduct,
  ApiProductAttribute,
  ApiTierPrice,
} from "./types";

export function normalizeImageUrl(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return `${API_URL}${src}`;
  return `${API_URL}/${src}`;
}

export type ImageSize = "thumbnail" | "normal" | "detail";

// Images are imported at the configured detail size, so the detail/main image
// uses the stored URL as-is. Smaller variants (cards, gallery thumbs) are
// produced by rewriting the size query param to these tokens. Override via env
// if a supplier uses different token values.
const IMAGE_SIZE_PARAM = process.env.NEXT_PUBLIC_IMAGE_SIZE_PARAM || "size";
const IMAGE_SIZE_TOKENS: Record<ImageSize, string> = {
  thumbnail: process.env.NEXT_PUBLIC_IMAGE_SIZE_THUMBNAIL || "thumb",
  normal: process.env.NEXT_PUBLIC_IMAGE_SIZE_NORMAL || "normal",
  detail: process.env.NEXT_PUBLIC_IMAGE_SIZE_DETAIL || "detail",
};

/**
 * Returns `url` with its size query param swapped to the requested variant.
 * No-op when the URL has no size param (e.g. locally downloaded images), so it
 * is always safe to call.
 */
export function sizedImage(
  url: string | undefined,
  size: ImageSize,
): string | undefined {
  if (!url) return url;
  const token = IMAGE_SIZE_TOKENS[size];
  const re = new RegExp(`([?&]${IMAGE_SIZE_PARAM}=)[^&#]*`, "i");
  return re.test(url) ? url.replace(re, `$1${token}`) : url;
}

const PLACEHOLDER_COLORS = [
  "#1a9e7a",
  "#1b2e4b",
  "#34d399",
  "#2dd4bf",
  "#0d9488",
  "#115e59",
  "#047857",
  "#818cf8",
  "#60a5fa",
  "#f87171",
  "#a78bfa",
  "#fb923c",
];

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

function pickColor(seed: string): string {
  return PLACEHOLDER_COLORS[hashIndex(seed, PLACEHOLDER_COLORS.length)]!;
}

function toNumber(value: string | number | undefined | null): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function toAttributes(value: unknown): ApiProductAttribute[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is ApiProductAttribute =>
      !!a &&
      typeof a === "object" &&
      typeof (a as ApiProductAttribute).name === "string" &&
      typeof (a as ApiProductAttribute).value === "string",
  );
}

function findAttribute(
  attrs: ApiProductAttribute[],
  name: string,
): string | undefined {
  const hit = attrs.find((a) => a.name.toLowerCase() === name.toLowerCase());
  return hit?.value;
}

/** Title-cases a color name so "SILVER"/"silver" both render as "Silver". */
function canonicalColor(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Split a Color attribute value into individual, de-duplicated color names.
 * The importer stores multi-color products as a comma-separated string (e.g.
 * ASI's `Attributes.Colors.Values[*].Name` → "Black, Blue, Green"); we also
 * tolerate `/` and `|` separators from other feeds. Returns [] when no color
 * is assigned so such products contribute no color filter chip.
 */
function splitColors(value: string | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(/[,/|]/)) {
    const c = canonicalColor(part);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

export interface CardProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  color: string;
  brand: string;
  /** Individual, filterable color names. Empty when no color is assigned. */
  colors: string[];
  rating: number;
  href: string;
  image?: string;
}

export function adaptProductForCard(p: ApiProduct): CardProduct {
  const attrs = toAttributes(p.attributes);
  const selling = toNumber(p.sellingPrice);
  const base = toNumber(p.basePrice);
  const hasDiscount = base > selling && selling > 0;
  const discount = hasDiscount
    ? Math.round(((base - selling) / base) * 100)
    : 0;

  const colors = splitColors(
    findAttribute(attrs, "color") ?? findAttribute(attrs, "colour"),
  );

  const firstImage = p.images?.[0];

  return {
    id: p.slug,
    name: p.name,
    price: selling || base,
    originalPrice: hasDiscount ? base : undefined,
    badge: hasDiscount ? `-${discount}%` : undefined,
    color: pickColor(p.id || p.slug),
    brand: findAttribute(attrs, "brand") ?? "",
    colors,
    rating: 4,
    href: `/product/${p.slug}`,
    image: firstImage
      ? sizedImage(normalizeImageUrl(firstImage), "normal")
      : undefined,
  };
}

export interface DetailImage {
  id: string;
  color: string;
  label: string;
  /** Largest (detail) variant — used for the main gallery image. */
  url?: string;
  /** Thumbnail variant — used for the gallery thumbnail strip. */
  thumbUrl?: string;
}

export interface QuantityPrice {
  quantity: string;
  price: number;
}

export interface DetailProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  sku: string;
  slug: string;
  categories: string[];
  categoryBreadcrumb: { label: string; href?: string }[];
  images: DetailImage[];
  description: string;
  shortDescription: string;
  additionalInfo: string;
  quantityPricing: QuantityPrice[];
  colorVariations?: string;
}

function tierToQuantity(t: ApiTierPrice, selling: number): QuantityPrice {
  const minQty = t.minQuantity;
  const effective =
    t.effectivePrice !== undefined
      ? toNumber(t.effectivePrice)
      : t.type === "PERCENTAGE"
        ? selling * (1 - toNumber(t.price) / 100)
        : toNumber(t.price);
  return {
    quantity: `${minQty}+`,
    price: Number(effective.toFixed(2)),
  };
}

export function adaptProductForDetail(p: ApiProduct): DetailProduct {
  const attrs = toAttributes(p.attributes);
  const selling = toNumber(p.sellingPrice);
  const base = toNumber(p.basePrice);
  const hasDiscount = base > selling && selling > 0;

  const seedColor = pickColor(p.id || p.slug);
  const images: DetailImage[] =
    p.images && p.images.length
      ? p.images.map((src, i) => {
          // Images are imported at the configured detail suffix, so the main
          // image uses the stored URL as-is. Only the thumbnail strip is
          // down-shifted to a smaller variant.
          const normalized = normalizeImageUrl(src);
          return {
            id: String(i + 1),
            color: seedColor,
            label: `Image ${i + 1}`,
            url: normalized,
            thumbUrl: sizedImage(normalized, "thumbnail"),
          };
        })
      : [
          { id: "1", color: seedColor, label: "Front" },
          { id: "2", color: seedColor, label: "Side" },
          { id: "3", color: seedColor, label: "Back" },
        ];

  const baseTier: QuantityPrice = {
    quantity: "1+",
    price: Number((selling || base).toFixed(2)),
  };
  const tiers = (p.tierPrices ?? [])
    .slice()
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((t) => tierToQuantity(t, selling));
  // Show bulk tiers first and the single-unit (qty 1) price as the last row.
  const baseRow = tiers.find((t) => t.quantity === "1+") ?? baseTier;
  const bulkTiers = tiers.filter((t) => t.quantity !== "1+");
  const quantityPricing = [...bulkTiers, baseRow];

  const additionalInfo = attrs.length
    ? attrs.map((a) => `${a.name}: ${a.value}`).join(" | ")
    : `SKU: ${p.sku}`;

  const categoryBreadcrumb: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/#shop" },
    ...(p.categories[0]
      ? [{ label: p.categories[0].name, href: `/category/${p.categories[0].slug}` }]
      : []),
    { label: p.name },
  ];

  return {
    id: p.id,
    name: p.name,
    price: selling || base,
    originalPrice: hasDiscount ? base : undefined,
    sku: p.sku,
    slug: p.slug,
    categories: p.categories.map((c) => c.name),
    categoryBreadcrumb,
    images,
    description: p.description ?? "",
    shortDescription: p.shortDescription ?? "",
    additionalInfo,
    quantityPricing,
    colorVariations: findAttribute(attrs, "color variations"),
  };
}

export interface AdaptedCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export function adaptCategory(c: ApiCategory): AdaptedCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count?.products ?? 0,
  };
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

export function buildCategoryTree(categories: ApiCategory[]): CategoryNode[] {
  const byParent = new Map<string | null, ApiCategory[]>();
  for (const c of categories) {
    const key = c.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }

  const visited = new Set<string>();

  const build = (parentId: string | null): CategoryNode[] => {
    const kids = byParent.get(parentId) ?? [];
    const out: CategoryNode[] = [];
    for (const k of kids) {
      if (visited.has(k.id)) continue;
      visited.add(k.id);
      out.push({
        id: k.id,
        name: k.name,
        slug: k.slug,
        children: build(k.id),
      });
    }
    return out;
  };

  const tree = build(null);

  // Append orphans (parent not in current list) as roots
  for (const c of categories) {
    if (!visited.has(c.id)) {
      visited.add(c.id);
      tree.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        children: build(c.id),
      });
    }
  }
  return tree;
}

const CATEGORY_ICON_PATHS: Record<string, string> = {
  "t-shirts": "M6.29 2h2.83l2.88 2.88L14.88 2h2.83L21 5.29v4.42l-3 3V21H6v-8.29l-3-3V5.29L6.29 2z",
  stationery:
    "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  drinkware:
    "M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 012 2v2a6 6 0 01-6 6h0a6 6 0 01-6-6V8a2 2 0 012-2z M8 16v4m8-4v4M7 20h10",
  bags: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  tech: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  corporate:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
};

const DEFAULT_ICON_PATH =
  "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4";

export function categoryIconPath(slug: string): string {
  return CATEGORY_ICON_PATHS[slug] ?? DEFAULT_ICON_PATH;
}
