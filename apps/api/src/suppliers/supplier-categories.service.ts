import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface SupplierCategoryListQuery {
  /** "unmapped" → only rows with categoryId IS NULL; "mapped" → only rows with categoryId set; omitted → both. */
  filter?: 'mapped' | 'unmapped';
  search?: string;
  take?: number;
  skip?: number;
}

@Injectable()
export class SupplierCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(supplierId: string, query: SupplierCategoryListQuery) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const where: Prisma.SupplierCategoryWhereInput = { supplierId };
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
      this.prisma.supplierCategory.findMany({
        where,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
        take,
        skip,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.supplierCategory.count({ where }),
    ]);

    // Enrich each row with its parent's name (lookup by externalId on the
    // same supplier) so the admin UI can show "Bags → Tote Bags" at a glance.
    const parentExternalIds = [
      ...new Set(items.map((i) => i.parentExternalId).filter((v): v is string => !!v)),
    ];
    const parents = parentExternalIds.length
      ? await this.prisma.supplierCategory.findMany({
          where: { supplierId, externalId: { in: parentExternalIds } },
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

  /** Assign a curated Category to this supplier category. Pass `null` to clear. */
  async setMapping(
    supplierId: string,
    id: string,
    categoryId: string | null,
  ) {
    const row = await this.prisma.supplierCategory.findFirst({
      where: { id, supplierId },
    });
    if (!row) throw new NotFoundException(`SupplierCategory ${id} not found`);

    if (categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!cat) throw new NotFoundException(`Category ${categoryId} not found`);
    }

    return this.prisma.supplierCategory.update({
      where: { id },
      data: { categoryId },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  }
}
