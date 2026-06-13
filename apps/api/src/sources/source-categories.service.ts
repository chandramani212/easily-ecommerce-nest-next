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

    const [items, total] = await Promise.all([
      this.prisma.sourceCategory.findMany({
        where,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
        take,
        skip,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.sourceCategory.count({ where }),
    ]);

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
