import { CuratedNode, SourceMap } from './category-map.types';

export interface FlatNode {
  slug: string;
  name: string;
  sortOrder: number;
  parentSlug: string | null;
  isLeaf: boolean;
}

/** Flatten the tree, parents before children (safe creation order for FKs). */
export function flattenTree(tree: CuratedNode[]): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (nodes: CuratedNode[], parent: string | null) => {
    nodes.forEach((n, i) => {
      out.push({
        slug: n.slug,
        name: n.name,
        sortOrder: n.sortOrder ?? i,
        parentSlug: parent,
        isLeaf: !n.children || n.children.length === 0,
      });
      if (n.children?.length) walk(n.children, n.slug);
    });
  };
  walk(tree, null);
  return out;
}

/** Slugs of every leaf (childless) node. */
export function leafSlugs(tree: CuratedNode[]): Set<string> {
  return new Set(flattenTree(tree).filter((n) => n.isLeaf).map((n) => n.slug));
}

/**
 * Validate that every sourceMap target exists in the tree AND is a leaf.
 * Returns human-readable errors; empty array means valid. (Products render
 * only on leaf categories, so a non-leaf target would be invisible.)
 */
export function validateSourceMap(
  tree: CuratedNode[],
  sourceMap: SourceMap,
): string[] {
  const bySlug = new Map(flattenTree(tree).map((n) => [n.slug, n]));
  const errs: string[] = [];
  for (const [key, slug] of Object.entries(sourceMap)) {
    const node = bySlug.get(slug);
    if (!node) errs.push(`sourceMap[${key}] -> "${slug}" missing from curatedTree`);
    else if (!node.isLeaf)
      errs.push(`sourceMap[${key}] -> "${slug}" is not a leaf (has children)`);
  }
  return errs;
}

/**
 * The slugs to actually create: every mapped leaf + all its ancestors, unioned
 * with `alwaysCreate` (+ their ancestors). Everything else in the tree is
 * pruned so the storefront gets no empty categories.
 */
export function usedSlugsToCreate(
  tree: CuratedNode[],
  sourceMap: SourceMap,
  alwaysCreate: string[],
): Set<string> {
  const parentOf = new Map(
    flattenTree(tree).map((n) => [n.slug, n.parentSlug] as const),
  );
  const out = new Set<string>();
  const addWithAncestors = (slug: string) => {
    let cur: string | null | undefined = slug;
    while (cur && !out.has(cur)) {
      out.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
  };
  for (const slug of Object.values(sourceMap)) addWithAncestors(slug);
  for (const slug of alwaysCreate) if (parentOf.has(slug)) addWithAncestors(slug);
  return out;
}

/** Product ids for the ASI ids present in the link map, de-duplicated. */
export function matchProductIds(
  asiIds: string[],
  linkByExternalId: Map<string, string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of asiIds) {
    const pid = linkByExternalId.get(id);
    if (pid && !seen.has(pid)) {
      seen.add(pid);
      out.push(pid);
    }
  }
  return out;
}
