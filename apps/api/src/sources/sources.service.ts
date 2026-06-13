import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Source } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSourceDto,
  SourceListQuery,
  SourceProductsQuery,
  TestConnectionDto,
  UpdateSourceDto,
} from './dto/source.dto';
import { buildAuthAdapter } from './runner/auth';
import { SecretsCipher } from './runner/encryption.util';
import { AsiCentralFetcher } from './runner/fetchers/asi-central.fetcher';
import { RestFetcher } from './runner/fetchers/rest.fetcher';

const SOURCE_PUBLIC_SELECT = {
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
} satisfies Prisma.SourceSelect;

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretsCipher,
  ) {}

  async findAll(query: SourceListQuery) {
    const where: Prisma.SourceWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { baseUrl: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.active !== undefined) where.active = query.active;

    const take = Math.min(Math.max(1, query.take ?? 20), 100);
    const skip = Math.max(0, query.skip ?? 0);

    const [rawItems, total] = await Promise.all([
      this.prisma.source.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { imports: true, links: true } } },
        take,
        skip,
      }),
      this.prisma.source.count({ where }),
    ]);

    const items = rawItems.map((s) => ({
      ...this.toPublic(s),
      productCount: s._count.links,
      importCount: s._count.imports,
    }));

    return { items, total };
  }

  async findOne(id: string) {
    const s = await this.prisma.source.findUnique({
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
    if (!s) throw new NotFoundException(`Source ${id} not found`);
    return {
      ...this.toPublic(s),
      productCount: s._count.links,
      importCount: s._count.imports,
      authConfigured: Boolean(s.authSecret),
      imports: s.imports,
    };
  }

  async create(dto: CreateSourceDto) {
    const data: Prisma.SourceCreateInput = {
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
    const created = await this.prisma.source.create({
      data,
      select: SOURCE_PUBLIC_SELECT,
    });
    return this.toPublic(created);
  }

  async update(id: string, dto: UpdateSourceDto) {
    const existing = await this.prisma.source.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Source ${id} not found`);

    const data: Prisma.SourceUpdateInput = {};
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

    const updated = await this.prisma.source.update({
      where: { id },
      data,
      select: SOURCE_PUBLIC_SELECT,
    });
    return this.toPublic(updated);
  }

  async remove(id: string) {
    try {
      await this.prisma.source.delete({ where: { id } });
      return { id };
    } catch {
      throw new NotFoundException(`Source ${id} not found`);
    }
  }

  /**
   * List products that have at least one link to this source.
   */
  async listProducts(sourceId: string, query: SourceProductsQuery) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

    const take = Math.min(Math.max(1, query.take ?? 50), 200);
    const skip = Math.max(0, query.skip ?? 0);

    const [links, total] = await Promise.all([
      this.prisma.sourceProductLink.findMany({
        where: { sourceId },
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
      this.prisma.sourceProductLink.count({ where: { sourceId } }),
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
   * Issue a single GET (or HEAD if asked) against the source endpoint to
   * verify auth + reachability. Doesn't parse or persist anything.
   */
  async testConnection(sourceId: string, dto: TestConnectionDto) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);
    if (source.kind === 'FILE_FEED') {
      throw new BadRequestException('FILE_FEED sources cannot be tested.');
    }
    const credentials = source.authSecret
      ? this.cipher.tryDecryptJson(source.authSecret)
      : null;
    const auth = buildAuthAdapter(source.authType, credentials ?? {});

    const fetcher =
      source.kind === 'ASI_CENTRAL'
        ? new AsiCentralFetcher(
            {
              baseUrl: source.baseUrl,
              // Limit to one page / one detail call for a snappy connectivity check.
              maxPages: 1,
              maxRecords: 1,
              timeoutMs: 15_000,
            },
            auth,
          )
        : (() => {
            const endpoint = dto.endpoint ?? '';
            if (!endpoint && !source.baseUrl) {
              throw new BadRequestException(
                'No endpoint provided and source has no baseUrl.',
              );
            }
            return new RestFetcher(
              {
                baseUrl: source.baseUrl,
                endpoint: endpoint || '/',
                method: dto.httpMethod ?? 'GET',
                timeoutMs: 15_000,
                maxBytes: 5 * 1024 * 1024,
              },
              auth,
            );
          })();
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

  private toPublic(s: Omit<Source, 'authSecret'> & { authSecret?: string | null }) {
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
