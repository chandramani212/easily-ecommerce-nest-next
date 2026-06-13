import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierDto,
  SupplierListQuery,
  SupplierProductsQuery,
  UpdateSupplierDto,
  UpsertManualSupplierDto,
} from './dto/supplier.dto';

const SUPPLIER_SELECT = {
  id: true,
  sourceId: true,
  origin: true,
  externalId: true,
  name: true,
  phone: true,
  altPhone: true,
  tollFree: true,
  website: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect;

/**
 * The real-world supplier companies behind a Source. Direct sources have
 * one MANUAL supplier (managed from the source form); aggregator sources gather
 * many FEED suppliers automatically as imports run.
 */
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupplierListQuery) {
    const where: Prisma.SupplierWhereInput = {};
    if (query.sourceId) where.sourceId = query.sourceId;
    if (query.origin) where.origin = query.origin;
    if (query.active !== undefined) where.active = query.active;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { website: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(Math.max(1, query.take ?? 20), 100);
    const skip = Math.max(0, query.skip ?? 0);

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        take,
        skip,
        select: {
          ...SUPPLIER_SELECT,
          source: { select: { id: true, name: true } },
          _count: { select: { productLinks: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      total,
      items: items.map((s) => ({
        ...this.toPublic(s),
        source: s.source,
        productCount: s._count.productLinks,
      })),
    };
  }

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({
      where: { id },
      select: {
        ...SUPPLIER_SELECT,
        source: { select: { id: true, name: true, kind: true } },
        _count: { select: { productLinks: true } },
      },
    });
    if (!s) throw new NotFoundException(`Supplier ${id} not found`);
    return {
      ...this.toPublic(s),
      source: s.source,
      productCount: s._count.productLinks,
    };
  }

  /** Products supplied by this company, via their source-product links. */
  async listProducts(id: string, query: SupplierProductsQuery) {
    const exists = await this.prisma.supplier.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Supplier ${id} not found`);

    const take = Math.min(Math.max(1, query.take ?? 50), 200);
    const skip = Math.max(0, query.skip ?? 0);

    const [links, total] = await Promise.all([
      this.prisma.sourceProductLink.findMany({
        where: { supplierId: id },
        orderBy: { lastSeenAt: 'desc' },
        take,
        skip,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              slug: true,
              sellingPrice: true,
              basePrice: true,
              active: true,
              images: true,
            },
          },
        },
      }),
      this.prisma.sourceProductLink.count({ where: { supplierId: id } }),
    ]);

    return {
      total,
      items: links.map((l) => ({
        externalId: l.externalId,
        lastSeenAt: l.lastSeenAt,
        product: l.product,
      })),
    };
  }

  async create(dto: CreateSupplierDto) {
    await this.assertSource(dto.sourceId);
    const created = await this.prisma.supplier.create({
      data: {
        sourceId: dto.sourceId,
        origin: 'MANUAL',
        externalId: '',
        name: dto.name,
        phone: dto.phone ?? null,
        altPhone: dto.altPhone ?? null,
        tollFree: dto.tollFree ?? null,
        website: dto.website ?? null,
        active: dto.active ?? true,
      },
      select: SUPPLIER_SELECT,
    });
    return this.toPublic(created);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Supplier ${id} not found`);

    const data: Prisma.SupplierUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.altPhone !== undefined) data.altPhone = dto.altPhone || null;
    if (dto.tollFree !== undefined) data.tollFree = dto.tollFree || null;
    if (dto.website !== undefined) data.website = dto.website || null;
    if (dto.active !== undefined) data.active = dto.active;

    const updated = await this.prisma.supplier.update({
      where: { id },
      data,
      select: SUPPLIER_SELECT,
    });
    return this.toPublic(updated);
  }

  async remove(id: string) {
    try {
      await this.prisma.supplier.delete({ where: { id } });
      return { id };
    } catch {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
  }

  /* ---- Manual supplier bound to a source (direct sources). ------------- */

  /** The single MANUAL supplier for a source, or null if none entered yet. */
  async getManualForSource(sourceId: string) {
    await this.assertSource(sourceId);
    const s = await this.prisma.supplier.findUnique({
      where: { sourceId_externalId: { sourceId, externalId: '' } },
      select: SUPPLIER_SELECT,
    });
    return s ? this.toPublic(s) : null;
  }

  /** Create-or-update the source's single manual supplier (externalId ''). */
  async upsertManualForSource(sourceId: string, dto: UpsertManualSupplierDto) {
    await this.assertSource(sourceId);
    const s = await this.prisma.supplier.upsert({
      where: { sourceId_externalId: { sourceId, externalId: '' } },
      create: {
        sourceId,
        origin: 'MANUAL',
        externalId: '',
        name: dto.name,
        phone: dto.phone ?? null,
        altPhone: dto.altPhone ?? null,
        tollFree: dto.tollFree ?? null,
        website: dto.website ?? null,
      },
      update: {
        name: dto.name,
        phone: dto.phone ?? null,
        altPhone: dto.altPhone ?? null,
        tollFree: dto.tollFree ?? null,
        website: dto.website ?? null,
      },
      select: SUPPLIER_SELECT,
    });
    return this.toPublic(s);
  }

  private async assertSource(sourceId: string) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);
  }

  private toPublic(s: Prisma.SupplierGetPayload<{ select: typeof SUPPLIER_SELECT }>) {
    return {
      id: s.id,
      sourceId: s.sourceId,
      origin: s.origin,
      externalId: s.externalId,
      name: s.name,
      phone: s.phone,
      altPhone: s.altPhone,
      tollFree: s.tollFree,
      website: s.website,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
