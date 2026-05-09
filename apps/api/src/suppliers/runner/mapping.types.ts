import { TierPriceType } from '@prisma/client';

/**
 * Wire format for a supplier-import mapping spec, persisted as JSON on
 * `SupplierImport.mapping`. The runner translates these into Prisma writes.
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
}

export interface CategoriesMap {
  source: SimpleField;
  separator?: string;
  /**
   * "name" — match existing categories by name (case-insensitive),
   * "slug" — match by slug,
   * "create" — create missing categories on the fly using the value as both
   *   name and slug (slugified).
   */
  match?: 'name' | 'slug' | 'create';
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
  categories: string[];
  tiers: MappedTier[];
  active: boolean;
}
