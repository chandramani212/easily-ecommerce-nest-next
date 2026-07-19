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
 * `SourceCategory.externalId` → curated LEAF slug. The externalId is the stable
 * per-source ASI code we stored on each SourceCategory row (e.g. "A01010003"),
 * so linking is an exact DB match. An omitted externalId = unmapped (e.g. a
 * top-level source category that has children: its leaf children are mapped
 * instead). Products render on leaf categories only.
 */
export type SourceMap = Record<string, string>;
