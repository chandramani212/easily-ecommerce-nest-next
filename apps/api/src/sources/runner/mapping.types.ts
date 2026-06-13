import { TierPriceType } from '@prisma/client';

/**
 * Wire format for a source-import mapping spec, persisted as JSON on
 * `SourceImport.mapping`. The runner translates these into Prisma writes.
 *
 * Source paths use the JSONPath subset implemented in `path.util.ts` and are
 * resolved against an individual record extracted by `recordsPath`.
 */

export type FieldTransform =
  | 'string'
  | 'lower'
  | 'upper'
  | 'trim'
  | 'slugify'
  | 'int'
  | 'float'
  | 'money'
  | 'bool'
  | 'split';

export interface SimpleField {
  /** JSONPath into a record. */
  path?: string;
  /**
   * Literal value; takes precedence over `path` if both are set.
   * Useful for fixed flags like `active: true`.
   */
  literal?: string | number | boolean | null;
  /**
   * Optional liquid-ish template, e.g. `"{{name}} ({{sku}})"`.
   * Variables come from the same record. Mutually exclusive with path/literal.
   */
  template?: string;
  /** Coercion pipeline applied left-to-right. */
  transforms?: FieldTransform[];
  /** Used by `split` transform; defaults to `,`. */
  splitSeparator?: string;
}

export interface AttributeMapItem {
  /** Static attribute name (e.g. "Color"). */
  name: string;
  value: SimpleField;
}

export interface TierMapItem {
  minQuantity: SimpleField;
  price: SimpleField;
  /** FIXED or PERCENTAGE. Defaults to FIXED. */
  type?: TierPriceType;
}

export interface ImagesMap {
  /** Path to a single string or array of strings. */
  source: SimpleField;
  /** When source resolves to a single string with this separator, split it. */
  separator?: string;
  /**
   * Prepended to any resolved URL that's relative (doesn't start with http://,
   * https://, or //). Useful for sources that return paths like
   * `media/97346407` instead of absolute URLs.
   */
  baseUrl?: string;
  /**
   * Appended to every resolved URL. Use for required query strings such as
   * `?size=normal`. If the URL already carries a query string and this value
   * starts with `?`, it's auto-promoted to `&`.
   *
   * @deprecated Prefer `sizes`. When `sizes` is absent this is still honored
   * as the "normal" size for backward compatibility.
   */
  urlSuffix?: string;
  /**
   * Per-size URL suffixes. Most image CDNs expose the same picture at several
   * resolutions via a query param (e.g. `?size=thumb` / `?size=normal` /
   * `?size=detail`). Configure each variant here; the runner stores images at
   * the largest configured size (detail → normal → thumbnail) so the
   * storefront can down-shift to smaller variants at render time. The
   * storefront swaps the size by rewriting that query param.
   */
  sizes?: {
    /** Smallest — used for gallery thumbnail strips and tiny previews. */
    thumbnail?: string;
    /** Medium — used for product cards and listings. */
    normal?: string;
    /** Largest — used for the product-detail main image. Stored on Product. */
    detail?: string;
  };
  /**
   * Optional path to a single "primary" image. When set, the resolved URL is
   * placed at index 0 of `images` (deduped). `Product.images[0]` is treated
   * as the featured image by convention.
   */
  featuredSource?: SimpleField;
  /**
   * When true, the runner downloads each image and stores it in the local
   * media library (MediaAsset), replacing the remote URL with the local one.
   * Download errors are swallowed — the remote URL is kept as a fallback so
   * one bad image doesn't fail the record.
   */
  download?: boolean;
}

export interface CategoriesMap {
  source: SimpleField;
  separator?: string;
  /**
   * "name" — match existing categories by name (case-insensitive),
   * "slug" — match by slug,
   * "create" — create missing categories on the fly using the value as both
   *   name and slug (slugified).
   *
   * Only used in flat-string mode (when `itemExternalIdPath` is NOT set).
   */
  match?: 'name' | 'slug' | 'create';

  /**
   * When the source resolves to an array of objects (e.g. ASI's
   * `{Id, Name, Parent: {Id, Name}}` shape), these paths describe where to
   * read the externalId / name / parent fields from each item.
   *
   * Setting `itemExternalIdPath` switches the runner into "structured" mode:
   *   - each (parent + child) category is upserted into `SourceCategory`
   *   - the product is attached only to curated `Category` rows that the
   *     admin has mapped via `SourceCategory.categoryId`
   *
   * When `itemExternalIdPath` is unset, the runner falls back to the
   * legacy flat-string behavior (auto-create against `Category`).
   */
  itemExternalIdPath?: string;
  itemNamePath?: string;
  itemParentExternalIdPath?: string;
  itemParentNamePath?: string;
}

/**
 * Per-record supplier (vendor) extraction. Set this on aggregator feeds where
 * each product row carries the real company that supplies it. The runner upserts
 * a `Supplier(origin: FEED)` per distinct vendor and links the product to it, so
 * the admin can browse "all products by supplier" across the aggregator.
 *
 * Omit entirely for direct sources — those carry one manually-entered Supplier.
 */
export interface VendorMap {
  /**
   * Stable vendor identity within the feed; used to upsert the Supplier across
   * runs. When absent, the runner derives a stable id from the slugified name.
   */
  externalId?: SimpleField;
  /** Required when `vendor` is set: the supplier company name. */
  name: SimpleField;
  phone?: SimpleField;
  altPhone?: SimpleField;
  tollFree?: SimpleField;
  website?: SimpleField;
}

export interface MappingSpec {
  /** Required: how to identify a record across runs. */
  externalId: SimpleField;
  /** Required: at minimum we need a name and SKU to upsert a Product. */
  name: SimpleField;
  sku: SimpleField;

  shortDescription?: SimpleField;
  description?: SimpleField;

  /** Source price. Markup is applied by the runner on top of these. */
  basePrice?: SimpleField;
  sellingPrice?: SimpleField;

  /** Boolean-coerced; defaults to true if absent. */
  active?: SimpleField;

  attributes?: AttributeMapItem[];
  images?: ImagesMap;
  categories?: CategoriesMap;
  tiers?: TierMapItem[];
  /** Aggregator feeds only: extract the supplier company from each record. */
  vendor?: VendorMap;
}

export interface MarkupSpec {
  kind: 'percent' | 'fixed';
  value: number;
  /** Which fields receive the markup. Defaults to ['basePrice','sellingPrice']. */
  appliesTo?: ('basePrice' | 'sellingPrice')[];
}

/* ---- Output of MapperService.mapRecord. -------------------------------- */

export interface MappedTier {
  minQuantity: number;
  price: number;
  type: TierPriceType;
}

export interface MappedAttribute {
  name: string;
  value: string;
}

/**
 * One source category as the mapper extracts it from a record. `externalId`
 * is set in structured mode (hierarchy-aware); in flat-string mode it's
 * derived from the slugified name and the parent fields are absent.
 */
export interface MappedCategory {
  externalId?: string;
  name: string;
  parentExternalId?: string;
  parentName?: string;
}

/**
 * One supplier company as the mapper extracts it from a record. `externalId`
 * is always populated (feed value, or slugified name as a stable fallback) so
 * the runner can upsert the Supplier idempotently across runs.
 */
export interface MappedVendor {
  externalId: string;
  name: string;
  phone?: string;
  altPhone?: string;
  tollFree?: string;
  website?: string;
}

export interface MappedProduct {
  externalId: string;
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  sellingPrice: number;
  images: string[];
  attributes: MappedAttribute[];
  categories: MappedCategory[];
  tiers: MappedTier[];
  active: boolean;
  /** Present only when the import's mapping defines a `vendor` block. */
  vendor?: MappedVendor;
}
