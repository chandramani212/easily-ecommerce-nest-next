/**
 * One node in the curated storefront taxonomy. "3-level" is the max depth
 * (L1 group → L2 category → L3 subcategory); a branch may stop shallower.
 * Nodes with no `children` are LEAVES — the only categories the storefront
 * renders products on (a node with children renders subcategory tiles).
 */
export interface CuratedNode {
  slug: string; // unique storefront slug (kebab-case)
  name: string; // display name
  sortOrder?: number; // order among siblings; defaults to array index
  children?: CuratedNode[];
}

/**
 * ASI category ContextPath → curated LEAF slug. The ContextPath (e.g.
 * "T-SHIRTS", "T-Shirts-Mens") is the token ASI search accepts — NOT the
 * `SourceCategory.externalId` we stored. An omitted ContextPath = skipped.
 */
export type SourceMap = Record<string, string>;
