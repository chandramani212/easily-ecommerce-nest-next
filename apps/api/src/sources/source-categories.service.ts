import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface SourceCategoryListQuery {
  /** "unmapped" → only rows with categoryId IS NULL; "mapped" → only rows with categoryId set; omitted → both. */
  filter?: 'mapped' | 'unmapped';
  search?: string;
  take?: number;
  skip?: number;
}

/**
 * Order source categories parent-first (depth-first pre-order) using each
 * source's own `externalId`/`parentExternalId` links. Rows whose parent is not
 * present in the set (filtered out, or a genuine top-level) become roots and
 * their descendants are walked from there. Because a node always follows its
 * ancestors, slicing this order for pagination never separates a child from
 * its parent. `name`-sorted input keeps siblings alphabetical.
 */
function orderParentFirst<
  T extends { externalId: string; parentExternalId: string | null },
>(rows: T[]): T[] {
  const childrenByParent = new Map<string | null, T[]>();
  for (const r of rows) {
    const key = r.parentExternalId ?? null;
    const bucket = childrenByParent.get(key);
    if (bucket) bucket.push(r);
    else childrenByParent.set(key, [r]);
  }

  const present = new Set(rows.map((r) => r.externalId));
  const result: T[] = [];
  const visited = new Set<string>();

  const walk = (parentExternalId: string | null) => {
    for (const node of childrenByParent.get(parentExternalId) ?? []) {
      if (visited.has(node.externalId)) continue;
      visited.add(node.externalId);
      result.push(node);
      walk(node.externalId);
    }
  };

  // Roots: no parent, or a parent that isn't in the current set.
  for (const r of rows) {
    const parent = r.parentExternalId ?? null;
    if (parent === null || !present.has(parent)) {
      if (visited.has(r.externalId)) continue;
      visited.add(r.externalId);
      result.push(r);
      walk(r.externalId);
    }
  }

  // Safety net for any cyclic/self-referential links the walk didn't reach.
  for (const r of rows) {
    if (!visited.has(r.externalId)) {
      visited.add(r.externalId);
      result.push(r);
    }
  }

  return result;
}

@Injectable()
export class SourceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(sourceId: string, query: SourceCategoryListQuery) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

    const where: Prisma.SourceCategoryWhereInput = { sourceId };
    if (query.filter === 'mapped') where.categoryId = { not: null };
    else if (query.filter === 'unmapped') where.categoryId = null;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { externalId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(Math.max(1, query.take ?? 50), 200);
    const skip = Math.max(0, query.skip ?? 0);

    // Fetch the full matching set and order it parent-first (DFS pre-order) so
    // pagination never splits a child from its parent. With a plain
    // `orderBy: categoryId` + `take` window, a child can land inside the window
    // while its parent falls outside it, surfacing the child as an orphan. In
    // pre-order a node always follows its ancestors, so any row within the
    // sliced window is guaranteed to have its ancestors in the window too.
    const matched = await this.prisma.sourceCategory.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    const total = matched.length;
    const items = orderParentFirst(matched).slice(skip, skip + take);

    // Enrich each row with its parent's name (lookup by externalId on the
    // same source) so the admin UI can show "Bags → Tote Bags" at a glance.
    const parentExternalIds = [
      ...new Set(items.map((i) => i.parentExternalId).filter((v): v is string => !!v)),
    ];
    const parents = parentExternalIds.length
      ? await this.prisma.sourceCategory.findMany({
          where: { sourceId, externalId: { in: parentExternalIds } },
          select: { externalId: true, name: true },
        })
      : [];
    const parentNameByExternalId = new Map(parents.map((p) => [p.externalId, p.name]));

    return {
      total,
      items: items.map((i) => ({
        id: i.id,
        externalId: i.externalId,
        name: i.name,
        parentExternalId: i.parentExternalId,
        parentName: i.parentExternalId
          ? parentNameByExternalId.get(i.parentExternalId) ?? null
          : null,
        category: i.category,
        lastSeenAt: i.lastSeenAt,
      })),
    };
  }

  /** Assign a curated Category to this source category. Pass `null` to clear. */
  async setMapping(
    sourceId: string,
    id: string,
    categoryId: string | null,
  ) {
    const row = await this.prisma.sourceCategory.findFirst({
      where: { id, sourceId },
    });
    if (!row) throw new NotFoundException(`SourceCategory ${id} not found`);

    if (categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!cat) throw new NotFoundException(`Category ${categoryId} not found`);
    }

    return this.prisma.sourceCategory.update({
      where: { id },
      data: { categoryId },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }
}
