import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  Source,
  SourceImport,
  SourceImportFormat,
  SourceImportRunStatus,
  SourceImportTrigger,
} from '@prisma/client';

import { MediaService } from '../../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { buildAuthAdapter } from './auth';
import { SecretsCipher } from './encryption.util';
import { AsiCentralFetcher } from './fetchers/asi-central.fetcher';
import { FileFetcher } from './fetchers/file.fetcher';
import { RestFetcher } from './fetchers/rest.fetcher';
import { Fetcher } from './fetchers/fetcher';
import { MapperService } from './mapper.service';
import {
  MappedCategory,
  MappedProduct,
  MappingSpec,
  MarkupSpec,
} from './mapping.types';
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
  trigger?: SourceImportTrigger;
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
  status: SourceImportRunStatus;
  totals: { created: number; updated: number; skipped: number; failed: number };
  errors: { record: number; externalId?: string; error: string }[];
  /** Populated for dry runs only. */
  rows?: RunResultRow[];
}

/**
 * Orchestrates a single source-import run: fetch → parse → map → upsert.
 *
 * - Concurrency guard prevents two scheduled runs of the same import racing.
 * - Each record is wrapped in its own try/catch so one bad row doesn't break
 *   the whole batch; errors are accumulated on the run row.
 * - Identity is via `SourceProductLink(sourceId, externalId)` keyed by the
 *   source's own ID — so the same SKU can come from multiple sources and
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
    private readonly media: MediaService,
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
      const imp = await this.prisma.sourceImport.findUnique({
        where: { id: importId },
        include: { source: true },
      });
      if (!imp) throw new Error(`SourceImport ${importId} not found`);

      // Persist a fresh run row up front so we always have something to update,
      // even if fetching/parsing throws below. Skipped for dry runs.
      const runRow = opts.dryRun
        ? null
        : await this.prisma.sourceImportRun.create({
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
        const status: SourceImportRunStatus = 'FAILED';
        const errors = [{ record: -1, error: errorMsg }];
        if (runRow) {
          await this.prisma.sourceImportRun.update({
            where: { id: runRow.id },
            data: {
              status,
              finishedAt: new Date(),
              errors: errors as unknown as Prisma.InputJsonValue,
            },
          });
          await this.prisma.sourceImport.update({
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
    imp: SourceImport & { source: Source },
    opts: RunOptions,
  ): Promise<unknown[]> {
    const fetcher = await this.buildFetcher(imp, opts);
    const payload = await fetcher.fetch();
    // ASI_CENTRAL fetcher emits a synthetic JSON envelope of shape
    // `{ records: [...] }`; force-pin the parser config so user mis-settings
    // on the import row can't break it.
    const isAsi = imp.source.kind === 'ASI_CENTRAL' && !opts.sample;
    const format: SourceImportFormat = isAsi
      ? 'JSON'
      : (imp.format as SourceImportFormat);
    const recordsPath = isAsi ? '$.records' : imp.recordsPath;
    const parser = parserFor(format);
    const parsed = parser.parse(payload.body, recordsPath);
    return parsed.records;
  }

  private async buildFetcher(
    imp: SourceImport & { source: Source },
    opts: RunOptions,
  ): Promise<Fetcher> {
    if (opts.sample) {
      return new FileFetcher(opts.sample.body, opts.sample.contentType);
    }
    if (imp.source.kind === 'FILE_FEED') {
      throw new Error(
        'FILE_FEED imports require a sample/data file upload to run.',
      );
    }
    const credentials = imp.source.authSecret
      ? this.cipher.tryDecryptJson(imp.source.authSecret)
      : null;
    const auth = buildAuthAdapter(imp.source.authType, credentials ?? {});

    if (imp.source.kind === 'ASI_CENTRAL') {
      const asiCfg = parseAsiConfig(imp.body);
      return new AsiCentralFetcher(
        {
          baseUrl: imp.source.baseUrl,
          searchQuery: asiCfg.searchQuery ?? null,
          maxPages: asiCfg.maxPages,
          maxRecords: asiCfg.maxRecords,
        },
        auth,
      );
    }

    if (!imp.endpoint) {
      throw new Error('REST imports require an endpoint URL.');
    }
    const headers =
      imp.headers && typeof imp.headers === 'object'
        ? (imp.headers as Record<string, string>)
        : {};
    return new RestFetcher(
      {
        baseUrl: imp.source.baseUrl,
        endpoint: imp.endpoint,
        method: imp.httpMethod,
        headers,
        body: imp.body,
      },
      auth,
    );
  }

  private async processRecords(
    imp: SourceImport & { source: Source },
    records: unknown[],
    dryRun: boolean,
  ): Promise<Omit<RunResult, 'runId'>> {
    const spec = (imp.mapping ?? {}) as unknown as MappingSpec;
    const markup = imp.markup as unknown as MarkupSpec | undefined;
    const totals = { created: 0, updated: 0, skipped: 0, failed: 0 };
    const errors: { record: number; externalId?: string; error: string }[] = [];
    const rows: RunResultRow[] = [];
    const seenLinkIds: string[] = [];

    const shouldDownloadImages = !!spec.images?.download;
    // Build auth headers up front so we don't decrypt/build per image. The
    // header set is identical across all images in a run because credentials
    // live on the source, not the import.
    const imageAuthHeaders = shouldDownloadImages
      ? await this.buildAuthHeaders(imp.source)
      : null;

    // Direct sources carry one manually-entered Supplier; when the feed has no
    // per-record vendor mapping, every imported product is linked to it. Resolved
    // once per run. (Aggregator feeds override this per-record via mapped.vendor.)
    const fallbackSupplierId = dryRun
      ? null
      : (
          await this.prisma.supplier.findFirst({
            where: { sourceId: imp.source.id, origin: 'MANUAL' },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
        )?.id ?? null;

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
        if (shouldDownloadImages && mapped.images.length) {
          const { urls, failures } = await this.localizeImages(
            mapped.images,
            imageAuthHeaders ?? undefined,
          );
          mapped.images = urls;
          for (const f of failures) {
            if (errors.length < ImportRunnerService.MAX_LOGGED_ERRORS) {
              errors.push({
                record: i,
                externalId: mapped.externalId,
                error: `image download failed: ${f.url} — ${f.error}`,
              });
            }
          }
        }
        const result = await this.upsertOne(imp.source.id, mapped, fallbackSupplierId);
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
      await this.deactivateMissing(imp.source.id, seenLinkIds);
    }

    // A 0-record fetch used to be reported as SUCCESS (totals.failed === 0,
    // trivially). For ASI Central that masked a real bug — the search response
    // key wasn't recognized, so nothing was ever imported.
    if (records.length === 0) {
      errors.push({
        record: -1,
        error:
          'Fetcher returned 0 records. Check source endpoint, credentials, and search query.',
      });
      return {
        status: 'FAILED',
        totals,
        errors,
        rows: dryRun ? rows : undefined,
      };
    }

    const status: SourceImportRunStatus =
      totals.failed === 0
        ? 'SUCCESS'
        : totals.failed < records.length
          ? 'PARTIAL'
          : 'FAILED';

    return { status, totals, errors, rows: dryRun ? rows : undefined };
  }

  /**
   * Upsert a single product via the SourceProductLink junction. Idempotent:
   * re-running on unchanged input still produces an "updated" action.
   */
  private async upsertOne(
    sourceId: string,
    mapped: MappedProduct,
    fallbackSupplierId: string | null,
  ): Promise<{
    action: 'created' | 'updated' | 'skipped';
    productId?: string;
    linkId?: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const existingLink = await tx.sourceProductLink.findUnique({
        where: {
          sourceId_externalId: { sourceId, externalId: mapped.externalId },
        },
      });

      // Resolve which real supplier this product belongs to: the per-record
      // vendor from an aggregator feed (upserted here, origin FEED), else the
      // source's manually-entered supplier. Null when neither is configured.
      const supplierId = mapped.vendor
        ? (
            await tx.supplier.upsert({
              where: {
                sourceId_externalId: {
                  sourceId,
                  externalId: mapped.vendor.externalId,
                },
              },
              create: {
                sourceId,
                origin: 'FEED',
                externalId: mapped.vendor.externalId,
                name: mapped.vendor.name,
                phone: mapped.vendor.phone ?? null,
                altPhone: mapped.vendor.altPhone ?? null,
                tollFree: mapped.vendor.tollFree ?? null,
                website: mapped.vendor.website ?? null,
              },
              update: {
                name: mapped.vendor.name,
                phone: mapped.vendor.phone ?? null,
                altPhone: mapped.vendor.altPhone ?? null,
                tollFree: mapped.vendor.tollFree ?? null,
                website: mapped.vendor.website ?? null,
              },
              select: { id: true },
            })
          ).id
        : fallbackSupplierId;

      const categoryIds = await this.resolveCategoryIds(tx, sourceId, mapped.categories);

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

      // Only stamp supplierId when we resolved one, so re-runs of a feed that
      // later drops its vendor mapping don't wipe an existing association.
      const linkUpdate: Prisma.SourceProductLinkUncheckedUpdateInput = {
        productId,
        lastSeenAt: new Date(),
      };
      if (supplierId) linkUpdate.supplierId = supplierId;

      const link = await tx.sourceProductLink.upsert({
        where: {
          sourceId_externalId: { sourceId, externalId: mapped.externalId },
        },
        create: { sourceId, externalId: mapped.externalId, productId, supplierId },
        update: linkUpdate,
      });

      return { action, productId, linkId: link.id };
    });
  }

  /**
   * Download each remote image into the local media library and return the
   * local URLs alongside a list of per-image failures. The remote URL is
   * kept in place of any failed download so one bad image doesn't break the
   * whole record; the failures are surfaced to the run row so the admin can
   * see which images and why.
   */
  private async localizeImages(
    urls: string[],
    authHeaders?: Record<string, string>,
  ): Promise<{ urls: string[]; failures: { url: string; error: string }[] }> {
    const out: string[] = [];
    const failures: { url: string; error: string }[] = [];
    for (const url of urls) {
      // Already a local upload? Skip the round-trip.
      if (url.includes('/uploads/')) {
        out.push(url);
        continue;
      }
      try {
        const asset = await this.media.downloadFromUrl(
          url,
          undefined,
          authHeaders,
        );
        out.push(asset.url);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Image download failed for ${url}: ${error}`);
        failures.push({ url, error });
        out.push(url);
      }
    }
    return { urls: out, failures };
  }

  /**
   * Resolve the source's auth adapter into a static header set. Returns null
   * for `NONE` auth so we don't add empty headers. For OAuth-style adapters
   * this triggers the token exchange once up front.
   */
  private async buildAuthHeaders(
    source: Source,
  ): Promise<Record<string, string> | null> {
    if (source.authType === 'NONE') return null;
    const credentials = source.authSecret
      ? this.cipher.tryDecryptJson(source.authSecret)
      : null;
    const auth = buildAuthAdapter(source.authType, credentials ?? {});
    const plan = await auth.apply({ url: '', headers: {} });
    return plan.headers;
  }

  /**
   * Resolve the curated Category IDs to attach to a product.
   *
   * Structured mode (any incoming category has `externalId`):
   *   - Upsert every (parent + child) source category into SourceCategory
   *     so the admin can see the full hierarchy and map it later.
   *   - A product is only attached to curated Categories that have been
   *     mapped via SourceCategory.categoryId. Unmapped source categories
   *     contribute nothing — keeping the storefront tree clean.
   *
   * Flat-string mode (no externalId on any incoming category):
   *   - Legacy behavior: find-or-create curated Category by slug/name.
   */
  private async resolveCategoryIds(
    tx: Prisma.TransactionClient,
    sourceId: string,
    categories: MappedCategory[],
  ): Promise<string[]> {
    if (!categories.length) return [];
    const isStructured = categories.some((c) => c.externalId);

    if (isStructured) {
      const seenExternal = new Set<string>();
      for (const c of categories) {
        if (
          c.parentExternalId &&
          c.parentName &&
          !seenExternal.has(c.parentExternalId)
        ) {
          await tx.sourceCategory.upsert({
            where: {
              sourceId_externalId: {
                sourceId,
                externalId: c.parentExternalId,
              },
            },
            create: {
              sourceId,
              externalId: c.parentExternalId,
              name: c.parentName,
            },
            update: { name: c.parentName, lastSeenAt: new Date() },
          });
          seenExternal.add(c.parentExternalId);
        }
      }
      for (const c of categories) {
        if (!c.externalId || seenExternal.has(c.externalId)) continue;
        await tx.sourceCategory.upsert({
          where: {
            sourceId_externalId: { sourceId, externalId: c.externalId },
          },
          create: {
            sourceId,
            externalId: c.externalId,
            name: c.name,
            parentExternalId: c.parentExternalId ?? null,
          },
          update: {
            name: c.name,
            parentExternalId: c.parentExternalId ?? null,
            lastSeenAt: new Date(),
          },
        });
        seenExternal.add(c.externalId);
      }

      const externalIds = [...seenExternal];
      const mapped = await tx.sourceCategory.findMany({
        where: { sourceId, externalId: { in: externalIds } },
        select: { categoryId: true },
      });
      const ids = new Set<string>();
      for (const m of mapped) if (m.categoryId) ids.add(m.categoryId);
      return [...ids];
    }

    const ids = new Set<string>();
    for (const c of categories) {
      const raw = c.name;
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
    sourceId: string,
    seenLinkIds: string[],
  ): Promise<void> {
    const stale = await this.prisma.sourceProductLink.findMany({
      where: { sourceId, id: { notIn: seenLinkIds } },
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
    await this.prisma.sourceImportRun.update({
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
    await this.prisma.sourceImport.update({
      where: { id: importId },
      data: { lastRunAt: finishedAt, lastStatus: result.status, lastRunId: runId },
    });
  }
}

/**
 * ASI_CENTRAL imports stash optional fetcher tuning (search query, pagination
 * caps) as a small JSON blob in the otherwise-unused `body` column. Anything
 * we can't parse falls back to defaults — never crashes the run.
 */
function parseAsiConfig(raw: string | null | undefined): {
  searchQuery?: string | null;
  maxPages?: number;
  maxRecords?: number;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      searchQuery:
        typeof parsed.searchQuery === 'string'
          ? parsed.searchQuery
          : parsed.searchQuery === null
            ? null
            : undefined,
      maxPages:
        typeof parsed.maxPages === 'number' ? parsed.maxPages : undefined,
      maxRecords:
        typeof parsed.maxRecords === 'number' ? parsed.maxRecords : undefined,
    };
  } catch {
    return {};
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
