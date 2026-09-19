import type { PrismaService } from '../../prisma/prisma.service';

/** A category's position in the tree. */
export interface CategoryPath {
  id: string;
  slug: string;
  /** Names from the root down, e.g. ["Drinkware", "Mugs", "Ceramic Mugs"]. */
  names: string[];
  /** Sort key: deeper first, then sortOrder, then name. */
  order: string;
}

export interface CategoryLookup {
  byId: Map<string, CategoryPath>;
  bySlug: Map<string, CategoryPath>;
  /** "Name > Name > Name" (lowercased) → category id. */
  byPath: Map<string, string>;
}

export const pathKey = (names: readonly string[]) =>
  names.map((n) => n.toLowerCase()).join(' > ');

/**
 * Every category with its full path, loaded once (the tree is a few hundred
 * rows). Guards against a parent cycle.
 */
export async function loadCategoryLookup(
  prisma: PrismaService,
): Promise<CategoryLookup> {
  const cats = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true, sortOrder: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  const raw = new Map(cats.map((c) => [c.id, c]));
  const byId = new Map<string, CategoryPath>();
  const bySlug = new Map<string, CategoryPath>();
  const byPath = new Map<string, string>();

  for (const cat of cats) {
    const chain: string[] = [];
    const guard = new Set<string>();
    let node: (typeof cats)[number] | undefined = cat;
    while (node && !guard.has(node.id)) {
      guard.add(node.id);
      chain.unshift(node.name);
      node = node.parentId ? raw.get(node.parentId) : undefined;
    }
    const path: CategoryPath = {
      id: cat.id,
      slug: cat.slug,
      names: chain,
      order: `${9 - Math.min(chain.length, 9)}${String(cat.sortOrder).padStart(6, '0')}${cat.name}`,
    };
    byId.set(cat.id, path);
    bySlug.set(cat.slug, path);
    const k = pathKey(chain);
    // First wins (sortOrder order) when two siblings share a name.
    if (!byPath.has(k)) byPath.set(k, cat.id);
  }
  return { byId, bySlug, byPath };
}

/**
 * A product's primary category: the deepest link, then lowest sortOrder. A
 * product on a leaf plus a merchandising bucket (e.g. Best Sellers > Drinkware)
 * therefore reports the leaf; the rest are its "additional" categories.
 */
export function primaryOf(
  categoryIds: readonly string[],
  lookup: CategoryLookup,
): CategoryPath | undefined {
  return categoryIds
    .map((id) => lookup.byId.get(id))
    .filter((p): p is CategoryPath => Boolean(p))
    .sort((a, b) => a.order.localeCompare(b.order))[0];
}
