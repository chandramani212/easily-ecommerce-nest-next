import type { Category } from "./types";

/**
 * Pure category-tree helpers, kept out of the "use client" CategorySelect module
 * so server components (e.g. the categories list page) can call them too.
 * Exports from a "use client" file become client references and throw when
 * invoked on the server.
 */

/**
 * Collect a node and every descendant beneath it. Used to exclude an entire
 * subtree from the parent picker when editing a category: a node can't be
 * reparented under itself *or any of its descendants* without creating a cycle.
 */
export function collectSubtreeIds(
  categories: Category[],
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      const parentId = c.parentId ?? null;
      if (parentId && ids.has(parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

/**
 * Flatten a list of categories into a depth-annotated, parent-first order so a
 * flat list/table can render visual indentation by depth.
 *
 * `excludeId` removes a node *and its whole subtree* from the pool (used when
 * editing a category — you can't make a node its own ancestor). Excluding only
 * the node itself would orphan its descendants and flatten them to depth 0,
 * which both looks wrong and lets you pick a descendant as the new parent.
 */
export function buildCategoryTree(
  categories: Category[],
  excludeId?: string,
): { category: Category; depth: number }[] {
  const excluded = excludeId ? collectSubtreeIds(categories, excludeId) : null;
  const pool = excluded
    ? categories.filter((c) => !excluded.has(c.id))
    : categories;
  const childrenOf = (parentId: string | null) =>
    pool.filter((c) => (c.parentId ?? null) === parentId);
  const result: { category: Category; depth: number }[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null, depth: number) => {
    for (const node of childrenOf(parentId)) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      result.push({ category: node, depth });
      walk(node.id, depth + 1);
    }
  };

  walk(null, 0);

  // Orphans whose parent was excluded or missing — surface them at root depth.
  for (const c of pool) {
    if (!visited.has(c.id)) {
      visited.add(c.id);
      result.push({ category: c, depth: 0 });
    }
  }
  return result;
}
