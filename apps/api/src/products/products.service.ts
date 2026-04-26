import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  TierPriceDto,
  UpdateProductDto,
} from './dto/product.dto';

export interface ProductListQuery {
  q?: string;
  categoryId?: string;
  active?: string;
  page?: string;
  pageSize?: string;
}

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  tierPrices: { orderBy: { minQuantity: 'asc' as const } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );
    const where: Prisma.ProductWhereInput = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.active === 'true') where.active = true;
    if (query.active === 'false') where.active = false;

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          sku: dto.sku,
          description: dto.description ?? '',
          basePrice: dto.basePrice,
          images: dto.images ?? [],
          active: dto.active ?? true,
          categoryId: dto.categoryId,
          tierPrices: dto.tierPrices?.length
            ? { create: dto.tierPrices }
            : undefined,
        },
        include: PRODUCT_INCLUDE,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Product with the same SKU or slug already exists',
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.tierPrices) {
        await tx.tierPrice.deleteMany({ where: { productId: id } });
        if (dto.tierPrices.length > 0) {
          await tx.tierPrice.createMany({
            data: dto.tierPrices.map((t) => ({
              productId: id,
              minQuantity: t.minQuantity,
              price: t.price,
            })),
          });
        }
      }

      const { tierPrices, ...rest } = dto;
      return tx.product.update({
        where: { id },
        data: rest,
        include: PRODUCT_INCLUDE,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async exportCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });

    const rows = products.map((p) => ({
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      description: p.description,
      basePrice: p.basePrice.toString(),
      category: p.category?.slug ?? '',
      active: p.active ? 'true' : 'false',
      images: p.images.join('|'),
      tiers: p.tierPrices
        .map((t) => `${t.minQuantity}@${t.price.toString()}`)
        .join(';'),
    }));

    return csvStringify(rows, {
      header: true,
      columns: [
        'sku',
        'name',
        'slug',
        'description',
        'basePrice',
        'category',
        'active',
        'images',
        'tiers',
      ],
    });
  }

  async importCsv(csv: string) {
    const records = csvParse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const categories = await this.prisma.category.findMany();
    const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    let created = 0;
    let updated = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      if (!row) continue;
      try {
        if (!row.sku || !row.name) {
          throw new Error('sku and name are required');
        }
        const tierPrices: TierPriceDto[] = (row.tiers ?? '')
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((part) => {
            const [qty, price] = part.split('@');
            return {
              minQuantity: parseInt(qty ?? '0', 10),
              price: parseFloat(price ?? '0'),
            };
          });

        const images = (row.images ?? '')
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);

        const categoryId = row.category
          ? catBySlug.get(row.category)
          : undefined;

        const data = {
          name: row.name,
          slug: row.slug || row.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: row.description ?? '',
          basePrice: parseFloat(row.basePrice ?? '0'),
          images,
          active: row.active ? row.active === 'true' : true,
          categoryId,
        };

        const existing = await this.prisma.product.findUnique({
          where: { sku: row.sku },
        });

        if (existing) {
          await this.prisma.$transaction(async (tx) => {
            await tx.product.update({
              where: { sku: row.sku },
              data,
            });
            await tx.tierPrice.deleteMany({
              where: { productId: existing.id },
            });
            if (tierPrices.length) {
              await tx.tierPrice.createMany({
                data: tierPrices.map((t) => ({
                  productId: existing.id,
                  minQuantity: t.minQuantity,
                  price: t.price,
                })),
              });
            }
          });
          updated++;
        } else {
          await this.prisma.product.create({
            data: {
              ...data,
              sku: row.sku,
              tierPrices: tierPrices.length
                ? { create: tierPrices }
                : undefined,
            },
          });
          created++;
        }
      } catch (e) {
        errors.push({
          row: i + 2,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { created, updated, errors };
  }
}
