import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Supplier } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierDto,
  SupplierListQuery,
  SupplierProductsQuery,
  TestConnectionDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { buildAuthAdapter } from './runner/auth';
import { SecretsCipher } from './runner/encryption.util';
import { RestFetcher } from './runner/fetchers/rest.fetcher';

const SUPPLIER_PUBLIC_SELECT = {
  id: true,
  name: true,
  kind: true,
  baseUrl: true,
  authType: true,
  defaultMarkupPct: true,
  notes: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect;

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretsCipher,
  ) {}

  async findAll(query: SupplierListQuery) {
    const where: Prisma.SupplierWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { baseUrl: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.active !== undefined) where.active = query.active;

    const items = await this.prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { imports: true, links: true } } },
    });
    return items.map((s) => ({
      ...this.toPublic(s),
      productCount: s._count.links,
      importCount: s._count.imports,
    }));
  }

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        imports: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            format: true,
            cron: true,
            active: true,
            lastRunAt: true,
            lastStatus: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { imports: true, links: true } },
      },
    });
    if (!s) throw new NotFoundException(`Supplier ${id} not found`);
    return {
      ...this.toPublic(s),
      productCount: s._count.links,
      importCount: s._count.imports,
      authConfigured: Boolean(s.authSecret),
      imports: s.imports,
    };
  }

  async create(dto: CreateSupplierDto) {
    const data: Prisma.SupplierCreateInput = {
      name: dto.name,
      kind: dto.kind,
      authType: dto.authType,
      baseUrl: dto.baseUrl ?? null,
      defaultMarkupPct: dto.defaultMarkupPct ?? 0,
      notes: dto.notes ?? '',
      active: dto.active ?? true,
      authSecret: dto.authCredentials
        ? this.cipher.encryptJson(dto.authCredentials)
        : null,
    };
    const created = await this.prisma.supplier.create({
      data,
      select: SUPPLIER_PUBLIC_SELECT,
    });
    return this.toPublic(created);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Supplier ${id} not found`);

    const data: Prisma.SupplierUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.authType !== undefined) data.authType = dto.authType;
    if (dto.baseUrl !== undefined) data.baseUrl = dto.baseUrl;
    if (dto.defaultMarkupPct !== undefined)
      data.defaultMarkupPct = dto.defaultMarkupPct;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.authCredentials !== undefined) {
      data.authSecret = dto.authCredentials
        ? this.cipher.encryptJson(dto.authCredentials)
        : null;
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data,
      select: SUPPLIER_PUBLIC_SELECT,
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

  /**
   * List products that have at least one link to this supplier.
   */
  async listProducts(supplierId: string, query: SupplierProductsQuery) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const take = Math.min(Math.max(1, query.take ?? 50), 200);
    const skip = Math.max(0, query.skip ?? 0);

    const [links, total] = await Promise.all([
      this.prisma.supplierProductLink.findMany({
        where: { supplierId },
        skip,
        take,
        orderBy: { lastSeenAt: 'desc' },
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
      this.prisma.supplierProductLink.count({ where: { supplierId } }),
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

  /**
   * Issue a single GET (or HEAD if asked) against the supplier endpoint to
   * verify auth + reachability. Doesn't parse or persist anything.
   */
  async testConnection(supplierId: string, dto: TestConnectionDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);
    if (supplier.kind !== 'REST') {
      throw new BadRequestException('FILE_FEED suppliers cannot be tested.');
    }
    const endpoint = dto.endpoint ?? '';
    if (!endpoint && !supplier.baseUrl) {
      throw new BadRequestException(
        'No endpoint provided and supplier has no baseUrl.',
      );
    }
    const credentials = supplier.authSecret
      ? this.cipher.tryDecryptJson(supplier.authSecret)
      : null;
    const auth = buildAuthAdapter(supplier.authType, credentials ?? {});
    const fetcher = new RestFetcher(
      {
        baseUrl: supplier.baseUrl,
        endpoint: endpoint || '/',
        method: dto.httpMethod ?? 'GET',
        timeoutMs: 15_000,
        maxBytes: 5 * 1024 * 1024,
      },
      auth,
    );
    const startedAt = Date.now();
    try {
      const payload = await fetcher.fetch();
      return {
        ok: true,
        elapsedMs: Date.now() - startedAt,
        bytes: payload.body.length,
        contentType: payload.contentType ?? null,
      };
    } catch (err) {
      return {
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private toPublic(s: Omit<Supplier, 'authSecret'> & { authSecret?: string | null }) {
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      baseUrl: s.baseUrl,
      authType: s.authType,
      defaultMarkupPct: Number(s.defaultMarkupPct),
      notes: s.notes,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
