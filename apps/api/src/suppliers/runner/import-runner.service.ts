import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  Supplier,
  SupplierImport,
  SupplierImportFormat,
  SupplierImportRunStatus,
  SupplierImportTrigger,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { buildAuthAdapter } from './auth';
import { SecretsCipher } from './encryption.util';
import { FileFetcher } from './fetchers/file.fetcher';
import { RestFetcher } from './fetchers/rest.fetcher';
import { Fetcher } from './fetchers/fetcher';
import { MapperService } from './mapper.service';
import { MappedProduct, MappingSpec, MarkupSpec } from './mapping.types';
import { slugify } from './mapper.service';
import { parserFor } from './parsers/parser';

/* ---- Public types. ----------------------------------------------------- */

export interface RunOptions {
  /** Source override; for FILE_FEED imports or "test with sample" runs. */
  sample?: { body: Buffer; contentType?: string };
  /** When true, no DB writes happen and no run row is persisted. */
  dryRun?: boolean;
  /** Cap how many records are processed; useful for previews. */
  limit?: number;
  /** Why this run was triggered. Defaults to MANUAL. */
  trigger?: SupplierImportTrigger;
}

export interface RunResultRow {
  index: number;
  externalId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  productId?: string;
  error?: string;
  preview?: MappedProduct;
}

export interface RunResult {
  runId: string | null;
  status: SupplierImportRunStatus;
  totals: { created: number; updated: number; skipped: number; failed: number };
  errors: { record: number; externalId?: string; error: string }[];
  /** Populated for dry runs only. */
  rows?: RunResultRow[];
}

/**
 * Orchestrates a single supplier-import run: fetch → parse → map → upsert.
 *
 * - Concurrency guard prevents two scheduled runs of the same import racing.
 * - Each record is wrapped in its own try/catch so one bad row doesn't break
 *   the whole batch; errors are accumulated on the run row.
 * - Identity is via `SupplierProductLink(supplierId, externalId)` keyed by the
 *   supplier's own ID — so the same SKU can come from multiple suppliers and
 *   be tracked independently.
 */
@Injectable()
export class ImportRunnerService {
  private readonly logger = new Logger(ImportRunnerService.name);
  private readonly inFlight = new Set<string>();
  /** Max errors to keep on the run row to avoid bloating jsonb. */
  private static readonly MAX_LOGGED_ERRORS = 200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: MapperService,
    private readonly cipher: SecretsCipher,
  ) {}

  /**
   * Execute a run. If `opts.dryRun` is true, no DB mutations happen and the
   * full per-record preview is returned in `rows`.
   */
  async run(importId: string, opts: RunOptions = {}): Promise<RunResult> {
    if (!opts.dryRun) {
      if (this.inFlight.has(importId)) {
        throw new Error(
          `Import ${importId} is already running; concurrent run rejected.`,
        );
      }
      this.inFlight.add(importId);
    }

    try {
      const imp = await this.prisma.supplierImport.findUnique({
        where: { id: importId },
        include: { supplier: true },
      });
      if (!imp) throw new Error(`SupplierImport ${importId} not found`);

      // Persist a fresh run row up front so we always have something to update,
      // even if fetching/parsing throws below. Skipped for dry runs.
      const runRow = opts.dryRun
        ? null
        : await this.prisma.supplierImportRun.create({
            data: {
              importId,
              status: 'RUNNING',
              triggeredBy: opts.trigger ?? 'MANUAL',
            },
          });

      try {
        const records = await this.fetchAndParse(imp, opts);
        const limited = opts.limit ? records.slice(0, opts.limit) : records;
        const result = await this.processRecords(imp, limited, !!opts.dryRun);

        if (runRow) {
          await this.finalizeRun(runRow.id, importId, result);
        }
        return { runId: runRow?.id ?? null, ...result };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Import ${importId} failed: ${errorMsg}`);
        const status: SupplierImportRunStatus = 'FAILED';
        const errors = [{ record: -1, error: errorMsg }];
        if (runRow) {
          await this.prisma.supplierImportRun.update({
            where: { id: runRow.id },
            data: {
              status,
              finishedAt: new Date(),
              errors: errors as unknown as Prisma.InputJsonValue,
            },
          });
          await this.prisma.supplierImport.update({
            where: { id: importId },
            data: { lastRunAt: new Date(), lastStatus: status, lastRunId: runRow.id },
          });
        }
        return {
          runId: runRow?.id ?? null,
          status,
          totals: { created: 0, updated: 0, skipped: 0, failed: 0 },
          errors,
        };
      }
    } finally {
      if (!opts.dryRun) this.inFlight.delete(importId);
    }
  }

  /* ---- Internals. ------------------------------------------------------ */

  private async fetchAndParse(
    imp: SupplierImport & { supplier: Supplier },
    opts: RunOptions,
  ): Promise<unknown[]> {
    const fetcher = await this.buildFetcher(imp, opts);
    const payload = await fetcher.fetch();
    const parser = parserFor(imp.format as SupplierImportFormat);
    const parsed = parser.parse(payload.body, imp.recordsPath);
    return parsed.records;
  }

  private async buildFetcher(
    imp: SupplierImport & { supplier: Supplier },
    opts: RunOptions,
  ): Promise<Fetcher> {
    if (opts.sample) {
      return new FileFetcher(opts.sample.body, opts.sample.contentType);
    }
    if (imp.supplier.kind === 'FILE_FEED') {
      throw new Error(
        'FILE_FEED imports require a sample/data file upload to run.',
      );
    }
    if (!imp.endpoint) {
      throw new Error('REST imports require an endpoint URL.');
    }
    const credentials = imp.supplier.authSecret
      ? this.cipher.tryDecryptJson(imp.supplier.authSecret)
      : null;
    const auth = buildAuthAdapter(imp.supplier.authType, credentials ?? {});
    const headers =
      imp.headers && typeof imp.headers === 'object'
        ? (imp.headers as Record<string, string>)
        : {};
    return new RestFetcher(
      {
        baseUrl: imp.supplier.baseUrl,
        endpoint: imp.endpoint,
        method: imp.httpMethod,
        headers,
        body: imp.body,
      },
      auth,
    );
  }

  private async processRecords(
    imp: SupplierImport & { supplier: Supplier },
    records: unknown[],
    dryRun: boolean,
  ): Promise<Omit<RunResult, 'runId'>> {
    const spec = (imp.mapping ?? {}) as unknown as MappingSpec;
    const markup = imp.markup as unknown as MarkupSpec | undefined;
    const totals = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const errors: { record: number; externalId?: string; error: string }[] = [];
    const rows: RunResultRow[] = [];
    const seenLinkIds: string[] = [];

    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];
      try {
        const mapped = this.mapper.mapRecord(record, spec, markup);
        if (dryRun) {
          rows.push({
            index: i,
            externalId: mapped.externalId,
            action: 'updated',
            preview: mapped,
          });
          totals.updated += 1;
          continue;
        }
        const result = await this.upsertOne(imp.supplier.id, mapped);
        if (result.action === 'created') totals.created += 1;
        else if (result.action === 'updated') totals.updated += 1;
        else totals.skipped += 1;
        if (result.linkId) seenLinkIds.push(result.linkId);
        rows.push({
          index: i,
          externalId: mapped.externalId,
          action: result.action,
          productId: result.productId,
        });
      } catch (err) {
        totals.failed += 1;
        const error = err instanceof Error ? err.message : String(err);
        if (errors.length < ImportRunnerService.MAX_LOGGED_ERRORS) {
          errors.push({ record: i, error });
        }
        rows.push({ index: i, action: 'failed', error });
      }
    }

    if (!dryRun && imp.autoDeactivateMissing && totals.failed === 0) {
      await this.deactivateMissing(imp.supplier.id, seenLinkIds);
    }

    const status: SupplierImportRunStatus =
      totals.failed === 0
        ? 'SUCCESS'
        : totals.failed < records.length
          ? 'PARTIAL'
          : 'FAILED';

    return { status, totals, errors, rows: dryRun ? rows : undefined };
  }

  /**
   * Upsert a single product via the SupplierProductLink junction. Idempotent:
   * re-running on unchanged input still produces an "updated" action.
   */
  private async upsertOne(
    supplierId: string,
    mapped: MappedProduct,
  ): Promise<{
    action: 'created' | 'updated' | 'skipped';
    productId?: string;
    linkId?: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const existingLink = await tx.supplierProductLink.findUnique({
        where: {
          supplierId_externalId: { supplierId, externalId: mapped.externalId },
        },
      });

      const categoryIds = await this.resolveCategoryIds(tx, mapped.categories);

      const productData = {
        name: mapped.name,
        sku: mapped.sku,
        slug: slugify(mapped.name) || slugify(mapped.sku),
        shortDescription: mapped.shortDescription,
        description: mapped.description,
        basePrice: new Prisma.Decimal(mapped.basePrice),
        sellingPrice: new Prisma.Decimal(mapped.sellingPrice),
        images: mapped.images,
        attributes: mapped.attributes as unknown as Prisma.InputJsonValue,
        active: mapped.active,
      };

      let productId: string;
      let action: 'created' | 'updated';

      if (existingLink) {
        const updated = await tx.product.update({
          where: { id: existingLink.productId },
          data: {
            ...productData,
            categories: { set: categoryIds.map((id) => ({ id })) },
            tierPrices: {
              deleteMany: {},
              create: mapped.tiers.map((t) => ({
                minQuantity: t.minQuantity,
                price: new Prisma.Decimal(t.price),
                type: t.type,
              })),
            },
          },
        });
        productId = updated.id;
        action = 'updated';
      } else {
        // SKU may already exist (e.g. seeded manually) — link rather than
        // duplicate when so. Match is exact + case-sensitive on SKU.
        const bySku = await tx.product.findUnique({
          where: { sku: mapped.sku },
        });
        if (bySku) {
          const updated = await tx.product.update({
            where: { id: bySku.id },
            data: {
              ...productData,
              categories: { set: categoryIds.map((id) => ({ id })) },
              tierPrices: {
                deleteMany: {},
                create: mapped.tiers.map((t) => ({
                  minQuantity: t.minQuantity,
                  price: new Prisma.Decimal(t.price),
                  type: t.type,
                })),
              },
            },
          });
          productId = updated.id;
          action = 'updated';
        } else {
          // Slug collisions get a `-${externalId}` suffix to stay unique.
          const baseSlug = productData.slug;
          const slug = await uniqueSlug(tx, baseSlug, mapped.externalId);
          const created = await tx.product.create({
            data: {
              ...productData,
              slug,
              categories: { connect: categoryIds.map((id) => ({ id })) },
              tierPrices: {
                create: mapped.tiers.map((t) => ({
                  minQuantity: t.minQuantity,
                  price: new Prisma.Decimal(t.price),
                  type: t.type,
                })),
              },
            },
          });
          productId = created.id;
          action = 'created';
        }
      }

      const link = await tx.supplierProductLink.upsert({
        where: {
          supplierId_externalId: { supplierId, externalId: mapped.externalId },
        },
        create: { supplierId, externalId: mapped.externalId, productId },
        update: { productId, lastSeenAt: new Date() },
      });

      return { action, productId, linkId: link.id };
    });
  }

  private async resolveCategoryIds(
    tx: Prisma.TransactionClient,
    names: string[],
  ): Promise<string[]> {
    if (!names.length) return [];
    const ids = new Set<string>();
    for (const raw of names) {
      const slug = slugify(raw);
      if (!slug) continue;
      const existing =
        (await tx.category.findUnique({ where: { slug } })) ??
        (await tx.category.findFirst({
          where: { name: { equals: raw, mode: 'insensitive' } },
        }));
      if (existing) {
        ids.add(existing.id);
      } else {
        const created = await tx.category.create({
          data: { name: raw, slug },
        });
        ids.add(created.id);
      }
    }
    return [...ids];
  }

  private async deactivateMissing(
    supplierId: string,
    seenLinkIds: string[],
  ): Promise<void> {
    const stale = await this.prisma.supplierProductLink.findMany({
      where: { supplierId, id: { notIn: seenLinkIds } },
      select: { productId: true },
    });
    if (!stale.length) return;
    await this.prisma.product.updateMany({
      where: { id: { in: stale.map((s) => s.productId) } },
      data: { active: false },
    });
  }

  private async finalizeRun(
    runId: string,
    importId: string,
    result: Omit<RunResult, 'runId'>,
  ): Promise<void> {
    const finishedAt = new Date();
    await this.prisma.supplierImportRun.update({
      where: { id: runId },
      data: {
        status: result.status,
        finishedAt,
        created: result.totals.created,
        updated: result.totals.updated,
        skipped: result.totals.skipped,
        failed: result.totals.failed,
        errors: result.errors as unknown as Prisma.InputJsonValue,
      },
    });
    await this.prisma.supplierImport.update({
      where: { id: importId },
      data: { lastRunAt: finishedAt, lastStatus: result.status, lastRunId: runId },
    });
  }
}

async function uniqueSlug(
  tx: Prisma.TransactionClient,
  baseSlug: string,
  fallbackSuffix: string,
): Promise<string> {
  const root = baseSlug || 'product';
  const candidate = root;
  const exists = await tx.product.findUnique({ where: { slug: candidate } });
  if (!exists) return candidate;
  const suffix = slugify(fallbackSuffix) || Date.now().toString(36);
  return `${root}-${suffix}`.slice(0, 191);
}
