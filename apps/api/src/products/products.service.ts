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
  ProductAttributeDto,
  TierPriceDto,
  UpdateProductDto,
} from './dto/product.dto';
import { withEffectiveTierPrices } from './tier-pricing.util';

export interface ProductListQuery {
  q?: string;
  categoryId?: string;
  active?: string;
  page?: string;
  pageSize?: string;
}

const PRODUCT_INCLUDE = {
  categories: { select: { id: true, name: true, slug: true } },
  tierPrices: { orderBy: { minQuantity: 'asc' as const } },
  relatedTo: {
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      sellingPrice: true,
      basePrice: true,
      images: true,
      active: true,
    },
  },
} satisfies Prisma.ProductInclude;

function toAttributes(value: unknown): ProductAttributeDto[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (a): a is ProductAttributeDto =>
        !!a &&
        typeof a === 'object' &&
        typeof (a as ProductAttributeDto).name === 'string' &&
        typeof (a as ProductAttributeDto).value === 'string',
    )
    .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
    .filter((a) => a.name.length > 0);
}

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
    if (query.categoryId) {
      where.categories = { some: { id: query.categoryId } };
    }
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
      items: items.map((p) => withEffectiveTierPrices(p)),
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
    return withEffectiveTierPrices(product);
  }

  async create(dto: CreateProductDto) {
    try {
      const created = await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          sku: dto.sku,
          shortDescription: dto.shortDescription ?? '',
          description: dto.description ?? '',
          basePrice: dto.basePrice,
          sellingPrice: dto.sellingPrice,
          images: dto.images ?? [],
          active: dto.active ?? true,
          attributes: toAttributes(dto.attributes) as unknown as Prisma.InputJsonValue,
          categories: dto.categoryIds?.length
            ? { connect: dto.categoryIds.map((id) => ({ id })) }
            : undefined,
          relatedTo: dto.relatedProductIds?.length
            ? { connect: dto.relatedProductIds.map((id) => ({ id })) }
            : undefined,
          tierPrices: dto.tierPrices?.length
            ? {
                create: dto.tierPrices.map((t) => ({
                  minQuantity: t.minQuantity,
                  price: t.price,
                  type: t.type ?? 'FIXED',
                })),
              }
            : undefined,
        },
        include: PRODUCT_INCLUDE,
      });
      return withEffectiveTierPrices(created);
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

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.tierPrices) {
        await tx.tierPrice.deleteMany({ where: { productId: id } });
        if (dto.tierPrices.length > 0) {
          await tx.tierPrice.createMany({
            data: dto.tierPrices.map((t: TierPriceDto) => ({
              productId: id,
              minQuantity: t.minQuantity,
              price: t.price,
              type: t.type ?? 'FIXED',
            })),
          });
        }
      }

      const data: Prisma.ProductUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.slug !== undefined) data.slug = dto.slug;
      if (dto.sku !== undefined) data.sku = dto.sku;
      if (dto.shortDescription !== undefined)
        data.shortDescription = dto.shortDescription;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.basePrice !== undefined) data.basePrice = dto.basePrice;
      if (dto.sellingPrice !== undefined) data.sellingPrice = dto.sellingPrice;
      if (dto.images !== undefined) data.images = dto.images;
      if (dto.active !== undefined) data.active = dto.active;
      if (dto.attributes !== undefined) {
        data.attributes = toAttributes(
          dto.attributes,
        ) as unknown as Prisma.InputJsonValue;
      }
      if (dto.categoryIds !== undefined) {
        data.categories = {
          set: dto.categoryIds.map((cid) => ({ id: cid })),
        };
      }
      if (dto.relatedProductIds !== undefined) {
        data.relatedTo = {
          set: dto.relatedProductIds.map((rid) => ({ id: rid })),
        };
      }

      return tx.product.update({
        where: { id },
        data,
        include: PRODUCT_INCLUDE,
      });
    });

    return withEffectiveTierPrices(updated);
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
      shortDescription: p.shortDescription,
      description: p.description,
      basePrice: p.basePrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      categories: p.categories.map((c) => c.slug).join('|'),
      active: p.active ? 'true' : 'false',
      images: p.images.join('|'),
      tiers: p.tierPrices
        .map(
          (t) =>
            `${t.minQuantity}@${t.price.toString()}${t.type === 'PERCENTAGE' ? '%' : ''}`,
        )
        .join(';'),
      attributes: toAttributes(p.attributes)
        .map((a) => `${a.name}:${a.value}`)
        .join(';'),
    }));

    return csvStringify(rows, {
      header: true,
      columns: [
        'sku',
        'name',
        'slug',
        'shortDescription',
        'description',
        'basePrice',
        'sellingPrice',
        'categories',
        'active',
        'images',
        'tiers',
        'attributes',
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
            const [qty, raw] = part.split('@');
            const isPct = (raw ?? '').endsWith('%');
            const price = parseFloat((raw ?? '0').replace('%', ''));
            return {
              minQuantity: parseInt(qty ?? '0', 10),
              price,
              type: isPct ? ('PERCENTAGE' as const) : ('FIXED' as const),
            };
          });

        const images = (row.images ?? '')
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);

        const slugList = (row.categories ?? row.category ?? '')
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        const categoryIds = slugList
          .map((s) => catBySlug.get(s))
          .filter((id): id is string => Boolean(id));

        const attributes: ProductAttributeDto[] = (row.attributes ?? '')
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((part) => {
            const [name, ...rest] = part.split(':');
            return { name: name?.trim() ?? '', value: rest.join(':').trim() };
          })
          .filter((a) => a.name.length > 0);

        const basePrice = parseFloat(row.basePrice ?? '0');
        const sellingPrice = row.sellingPrice
          ? parseFloat(row.sellingPrice)
          : basePrice;

        const data = {
          name: row.name,
          slug: row.slug || row.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDescription: row.shortDescription ?? '',
          description: row.description ?? '',
          basePrice,
          sellingPrice,
          images,
          active: row.active ? row.active === 'true' : true,
          attributes: attributes as unknown as Prisma.InputJsonValue,
        };

        const existing = await this.prisma.product.findUnique({
          where: { sku: row.sku },
        });

        if (existing) {
          await this.prisma.$transaction(async (tx) => {
            await tx.product.update({
              where: { sku: row.sku },
              data: {
                ...data,
                categories: { set: categoryIds.map((id) => ({ id })) },
              },
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
                  type: t.type ?? 'FIXED',
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
              categories: categoryIds.length
                ? { connect: categoryIds.map((id) => ({ id })) }
                : undefined,
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
