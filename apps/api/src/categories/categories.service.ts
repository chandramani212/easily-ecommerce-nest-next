import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List categories. `activeOnly` (used by the public storefront) restricts to
   * active ones; the admin omits it and sees every category so it can manage
   * inactive ones too.
   */
  findAll(activeOnly = false) {
    return this.prisma.category.findMany({
      where: activeOnly ? { active: true } : undefined,
      // Manual order within each sibling group; name is a stable tiebreaker.
      // Consumers rebuild the tree by parentId, so global sortOrder ordering
      // still yields the correct per-parent order.
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Persist a new display order for a set of sibling categories. Each id's
   * `sortOrder` becomes its index in the provided array. Applied in one
   * transaction so the reorder is atomic.
   */
  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return { success: true };
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
