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
  /**
   * ASI only: when set, scope the run to these supplier `externalId`s (asi
   * numbers) instead of the full catalog. Same background run + report.
   */
  supplierExternalIds?: string[];
}

export interface RunResultRow {
  index: number;
  externalId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  productId?: string;
  error?: string;
  preview?: MappedProduct;
}

/**
 * Mutable state threaded through a run's per-record processing. Built once by
 * `createProcessContext`, fed records by `processBatch` (one call for a
 * buffered run, many for a streaming one), and resolved by `finishProcessing`.
 */
interface ProcessContext {
  spec: MappingSpec;
  markup: MarkupSpec | undefined;
  dryRun: boolean;
  shouldDownloadImages: boolean;
  imageAuthHeaders: Record<string, string> | null;
  fallbackSupplierId: string | null;
  totals: { created: number; updated: number; skipped: number; failed: number };
  errors: { record: number; externalId?: string; error: string }[];
  rows: RunResultRow[];
  seenLinkIds: string[];
  /** Records processed so far, across all batches — also the next record index. */
  processed: number;
  /**
   * Set when the fetch phase abandoned one or more search slices (e.g. an ASI
   * internal-error partition that survived retries). Records still processed
   * are kept, but the run finishes PARTIAL rather than SUCCESS so the gap is
   * visible instead of silently swallowed.
   */
  hadFetchError: boolean;
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
  /** Flush live progress counters to the run row every N processed records. */
  private static readonly PROGRESS_FLUSH_EVERY = 100;

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
    // Dry runs stay fully synchronous: no run row, no background work — the
    // caller wants the per-record preview back in the response body.
    if (opts.dryRun) {
      const imp = await this.prisma.sourceImport.findUnique({
        where: { id: importId },
        include: { source: true },
      });
      if (!imp) throw new Error(`SourceImport ${importId} not found`);
      const records = await this.fetchAndParse(imp, opts);
      const limited = opts.limit ? records.slice(0, opts.limit) : records;
      const result = await this.processRecords(imp, limited, true);
      return { runId: null, ...result };
    }

    // Real runs execute in the background so the HTTP caller returns instantly
    // with a run id it can poll for live progress. A full-catalog ASI sync pulls
    // one detail request per product and can run for a long time — blocking the
    // request on it would time out the browser long before it finishes.
    if (this.inFlight.has(importId)) {
      throw new Error(
        `Import ${importId} is already running; concurrent run rejected.`,
      );
    }
    this.inFlight.add(importId);

    let runRow: { id: string };
    try {
      const imp = await this.prisma.sourceImport.findUnique({
        where: { id: importId },
        include: { source: true },
      });
      if (!imp) throw new Error(`SourceImport ${importId} not found`);
      // Persist a fresh run row up front so pollers have something to read
      // immediately, even before the fetch phase reports a total.
      runRow = await this.prisma.sourceImportRun.create({
        data: {
          importId,
          status: 'RUNNING',
          triggeredBy: opts.trigger ?? 'MANUAL',
        },
      });
      // Fire-and-forget: the background task owns the concurrency guard from
      // here and always releases it, success or failure. executeRun handles its
      // own errors, but a `.catch()` here is a hard guarantee that a rejection
      // can NEVER surface as an unhandled promise rejection — which, under
      // Node's default policy, would crash the whole API process and take every
      // route down with it.
      const runId = runRow.id;
      void this.executeRun(imp, runId, opts)
        .catch((err) =>
          this.logger.error(
            `Import ${importId} background run crashed: ${
              err instanceof Error ? (err.stack ?? err.message) : String(err)
            }`,
          ),
        )
        .finally(() => this.inFlight.delete(importId));
    } catch (err) {
      // We failed before the background task took ownership of the guard.
      this.inFlight.delete(importId);
      throw err;
    }

    return {
      runId: runRow.id,
      status: 'RUNNING',
      totals: { created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [],
    };
  }

  /**
   * Background body of a real (non-dry) run: fetch → process → finalize. Handles
   * its own errors by marking the run FAILED — it is never awaited by the caller,
   * so a rejection here must not escape as an unhandled promise.
   */
  private async executeRun(
    imp: SourceImport & { source: Source },
    runId: string,
    opts: RunOptions,
  ): Promise<void> {
    try {
      // ASI Central pulls the full catalog one detail request at a time — a long,
      // rate-limited job. Stream it: map + upsert each batch as it downloads so
      // products appear during the run and a mid-run crash keeps what was already
      // written, instead of buffering everything for a single write at the end.
      if (imp.source.kind === 'ASI_CENTRAL' && !opts.sample) {
        await this.executeStreamingRun(imp, runId, opts);
        return;
      }

      // Surface download progress during the (longest) fetch phase. Best-effort,
      // fire-and-forget: a failed progress write must never abort the import.
      const onFetchProgress = (fetched: number, total: number): void => {
        void this.prisma.sourceImportRun
          .update({ where: { id: runId }, data: { fetched, total } })
          .catch(() => undefined);
      };
      const records = await this.fetchAndParse(imp, opts, onFetchProgress);
      const limited = opts.limit ? records.slice(0, opts.limit) : records;
      // Publish the denominator now that fetching is done, so a poller can draw
      // a real progress bar over the processing phase.
      await this.prisma.sourceImportRun.update({
        where: { id: runId },
        data: { total: limited.length, fetched: limited.length },
      });
      const result = await this.processRecords(imp, limited, false, runId);
      await this.finalizeRun(runId, imp.id, result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Import ${imp.id} failed: ${errorMsg}`);
      // Recording the failure is itself best-effort: if these writes throw (DB
      // down, connection reset), swallow it. An error escaping here would reject
      // the un-awaited background promise and could crash the process.
      try {
        const errors = [{ record: -1, error: errorMsg }];
        const finishedAt = new Date();
        await this.prisma.sourceImportRun.update({
          where: { id: runId },
          data: {
            status: 'FAILED',
            finishedAt,
            errors: errors as unknown as Prisma.InputJsonValue,
          },
        });
        await this.prisma.sourceImport.update({
          where: { id: imp.id },
          data: {
            lastRunAt: finishedAt,
            lastStatus: 'FAILED',
            lastRunId: runId,
          },
        });
      } catch (recordErr) {
        this.logger.error(
          `Failed to record FAILED status for run ${runId}: ${
            recordErr instanceof Error ? recordErr.message : String(recordErr)
          }`,
        );
      }
    }
  }

  /**
   * Streaming variant used for ASI Central: the fetcher hands us detail records
   * in batches as it downloads them, and we map + upsert each batch immediately,
   * flushing live counters to the run row. Products are therefore written
   * throughout the run (visible in the admin as they land) and survive a mid-run
   * failure — the enclosing `executeRun` still marks the run FAILED, but the rows
   * committed before the failure stay put.
   */
  private async executeStreamingRun(
    imp: SourceImport & { source: Source },
    runId: string,
    opts: RunOptions,
  ): Promise<void> {
    const ctx = await this.createProcessContext(imp, false);

    // Full sync: every run re-fetches and upserts the whole catalog — existing
    // products are updated, missing ones created. (No skip-existing.)
    const onFetchProgress = (fetched: number, total: number): void => {
      void this.prisma.sourceImportRun
        .update({ where: { id: runId }, data: { fetched, total } })
        .catch(() => undefined);
    };
    const onBatch = async (records: unknown[]): Promise<void> => {
      await this.processBatch(imp, records, ctx);
      // Flush counters after each batch so the admin poller sees rows accrue.
      await this.prisma.sourceImportRun
        .update({
          where: { id: runId },
          data: {
            created: ctx.totals.created,
            updated: ctx.totals.updated,
            skipped: ctx.totals.skipped,
            failed: ctx.totals.failed,
          },
        })
        .catch(() => undefined);
    };
    // A search slice that couldn't be walked (ASI internal error surviving
    // retries) is recorded here and the run continues — finishing PARTIAL, not
    // aborted. Capped like per-record errors so a storm can't bloat the jsonb.
    const onPartitionError = (info: { query: string; error: string }): void => {
      ctx.hadFetchError = true;
      if (ctx.errors.length < ImportRunnerService.MAX_LOGGED_ERRORS) {
        ctx.errors.push({
          record: -1,
          error: `search slice "${info.query}" skipped: ${info.error}`,
        });
      }
    };

    const fetcher = await this.buildFetcher(
      imp,
      opts,
      onFetchProgress,
      onBatch,
      onPartitionError,
    );
    await fetcher.fetch();

    const result = await this.finishProcessing(imp, ctx);
    await this.finalizeRun(runId, imp.id, result);
  }

  /* ---- Internals. ------------------------------------------------------ */

  private async fetchAndParse(
    imp: SourceImport & { source: Source },
    opts: RunOptions,
    onFetchProgress?: (fetched: number, total: number) => void,
  ): Promise<unknown[]> {
    const fetcher = await this.buildFetcher(imp, opts, onFetchProgress);
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
    onFetchProgress?: (fetched: number, total: number) => void,
    onBatch?: (records: unknown[]) => Promise<void>,
    onPartitionError?: (info: { query: string; error: string }) => void,
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
      let supplierScope: { externalId: string; name: string }[] | undefined;
      if (opts.supplierExternalIds?.length) {
        // The fetcher matches suppliers to ASI by NAME (our externalId is not
        // the asi company number), so pass name alongside externalId.
        supplierScope = await this.prisma.supplier.findMany({
          where: {
            sourceId: imp.source.id,
            externalId: { in: opts.supplierExternalIds },
          },
          select: { externalId: true, name: true },
        });
      }
      return new AsiCentralFetcher(
        {
          baseUrl: imp.source.baseUrl,
          searchQuery: asiCfg.searchQuery ?? null,
          maxPages: asiCfg.maxPages,
          maxRecords: asiCfg.maxRecords,
          supplierScope,
          onFetchProgress,
          onBatch,
          onPartitionError,
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

  /**
   * Process a whole record set in one shot: build context → process → finish.
   * Used by dry-run previews and buffered (non-streaming) real runs. Streaming
   * runs call `createProcessContext`/`processBatch`/`finishProcessing` directly.
   */
  private async processRecords(
    imp: SourceImport & { source: Source },
    records: unknown[],
    dryRun: boolean,
    runId?: string,
  ): Promise<Omit<RunResult, 'runId'>> {
    const ctx = await this.createProcessContext(imp, dryRun);
    await this.processBatch(imp, records, ctx, runId);
    return this.finishProcessing(imp, ctx);
  }

  // (createProcessContext / processBatch / finishProcessing follow.)

  /**
   * Build the once-per-run processing state: mapping spec, image auth headers,
   * and the fallback supplier, plus zeroed counters. Resolved up front so a
   * streaming run doesn't repeat this work per batch.
   */
  private async createProcessContext(
    imp: SourceImport & { source: Source },
    dryRun: boolean,
  ): Promise<ProcessContext> {
    const spec = (imp.mapping ?? {}) as unknown as MappingSpec;
    const markup = imp.markup as unknown as MarkupSpec | undefined;
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

    return {
      spec,
      markup,
      dryRun,
      shouldDownloadImages,
      imageAuthHeaders,
      fallbackSupplierId,
      totals: { created: 0, updated: 0, skipped: 0, failed: 0 },
      errors: [],
      rows: [],
      seenLinkIds: [],
      processed: 0,
      hadFetchError: false,
    };
  }

  /**
   * Map + upsert one batch of records into the shared context, advancing counters
   * and the processed cursor. Called once for a buffered run, repeatedly (one per
   * streamed batch) for an ASI run. When `runId` is set, running counters are
   * flushed every `PROGRESS_FLUSH_EVERY` records for live admin progress.
   */
  private async processBatch(
    imp: SourceImport & { source: Source },
    records: unknown[],
    ctx: ProcessContext,
    runId?: string,
  ): Promise<void> {
    for (const record of records) {
      const i = ctx.processed;
      try {
        const mapped = this.mapper.mapRecord(record, ctx.spec, ctx.markup);
        if (ctx.dryRun) {
          ctx.rows.push({
            index: i,
            externalId: mapped.externalId,
            action: 'updated',
            preview: mapped,
          });
          ctx.totals.updated += 1;
          ctx.processed += 1;
          continue;
        }
        if (ctx.shouldDownloadImages && mapped.images.length) {
          const { urls, failures } = await this.localizeImages(
            mapped.images,
            ctx.imageAuthHeaders ?? undefined,
          );
          mapped.images = urls;
          for (const f of failures) {
            if (ctx.errors.length < ImportRunnerService.MAX_LOGGED_ERRORS) {
              ctx.errors.push({
                record: i,
                externalId: mapped.externalId,
                error: `image download failed: ${f.url} — ${f.error}`,
              });
            }
          }
        }
        const result = await this.upsertOne(
          imp.source.id,
          mapped,
          ctx.fallbackSupplierId,
        );
        if (result.action === 'created') ctx.totals.created += 1;
        else if (result.action === 'updated') ctx.totals.updated += 1;
        else ctx.totals.skipped += 1;
        if (result.linkId) ctx.seenLinkIds.push(result.linkId);
        ctx.rows.push({
          index: i,
          externalId: mapped.externalId,
          action: result.action,
          productId: result.productId,
        });
      } catch (err) {
        ctx.totals.failed += 1;
        const error = err instanceof Error ? err.message : String(err);
        if (ctx.errors.length < ImportRunnerService.MAX_LOGGED_ERRORS) {
          ctx.errors.push({ record: i, error });
        }
        ctx.rows.push({ index: i, action: 'failed', error });
      }

      ctx.processed += 1;
      // Flush running counters periodically so the admin's poller can render
      // live progress. Best-effort: a failed flush must not abort the import.
      if (
        runId &&
        ctx.processed % ImportRunnerService.PROGRESS_FLUSH_EVERY === 0
      ) {
        await this.prisma.sourceImportRun
          .update({
            where: { id: runId },
            data: {
              created: ctx.totals.created,
              updated: ctx.totals.updated,
              skipped: ctx.totals.skipped,
              failed: ctx.totals.failed,
            },
          })
          .catch(() => undefined);
      }
    }
  }

  /**
   * Resolve a finished (or streamed-to-completion) context into a run result:
   * apply auto-deactivation, guard the empty-fetch case, and pick a status.
   */
  private async finishProcessing(
    imp: SourceImport & { source: Source },
    ctx: ProcessContext,
  ): Promise<Omit<RunResult, 'runId'>> {
    await this.maybeDeactivateMissing(imp, ctx);

    // A 0-record fetch used to be reported as SUCCESS (totals.failed === 0,
    // trivially). For ASI Central that masked a real bug — the search response
    // key wasn't recognized, so nothing was ever imported.
    if (ctx.processed === 0) {
      ctx.errors.push({
        record: -1,
        error:
          'Fetcher returned 0 records. Check source endpoint, credentials, and search query.',
      });
      return {
        status: 'FAILED',
        totals: ctx.totals,
        errors: ctx.errors,
        rows: ctx.dryRun ? ctx.rows : undefined,
      };
    }

    let status: SourceImportRunStatus =
      ctx.totals.failed === 0
        ? 'SUCCESS'
        : ctx.totals.failed < ctx.processed
          ? 'PARTIAL'
          : 'FAILED';
    // The fetch phase abandoned at least one search slice: records that WERE
    // pulled are committed, but the catalog is incomplete — report PARTIAL so
    // the gap is visible rather than a misleading all-green SUCCESS.
    if (ctx.hadFetchError && status === 'SUCCESS') status = 'PARTIAL';

    return {
      status,
      totals: ctx.totals,
      errors: ctx.errors,
      rows: ctx.dryRun ? ctx.rows : undefined,
    };
  }

  /** Deactivate products no longer present in the feed (opt-in per import). */
  private async maybeDeactivateMissing(
    imp: SourceImport & { source: Source },
    ctx: ProcessContext,
  ): Promise<void> {
    if (!ctx.dryRun && imp.autoDeactivateMissing && ctx.totals.failed === 0) {
      await this.deactivateMissing(imp.source.id, ctx.seenLinkIds);
    }
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

      const { categoryIds, sourceCategoryIds } = await this.resolveCategoryIds(
        tx,
        sourceId,
        mapped.categories,
      );

      const productData = {
        name: mapped.name,
        // Website SKU: use the mapped value when present, else omit so the DB
        // default (EB-000123) generates one on create. `undefined` on update
        // leaves an existing sku untouched, so re-syncs never clobber it.
        sku: mapped.sku || undefined,
        // Supplier/API SKU kept for reconciliation; omit when the feed has none.
        externalSku: mapped.externalSku || undefined,
        // NOTE: `slug` is intentionally NOT in the shared data — it's set once on
        // create (deduped below). Rewriting it on every update collides with
        // other products that slugify to the same name, and would churn URLs.
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
            sourceCategories: { set: sourceCategoryIds.map((id) => ({ id })) },
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
        // The supplier SKU may already exist (e.g. seeded manually) — link rather
        // than duplicate when so. Match is exact + case-sensitive on externalSku.
        // Skipped when the feed carries no supplier SKU.
        const bySku = mapped.externalSku
          ? await tx.product.findUnique({
              where: { externalSku: mapped.externalSku },
            })
          : null;
        if (bySku) {
          const updated = await tx.product.update({
            where: { id: bySku.id },
            data: {
              ...productData,
              categories: { set: categoryIds.map((id) => ({ id })) },
            sourceCategories: { set: sourceCategoryIds.map((id) => ({ id })) },
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
          const baseSlug =
            slugify(mapped.name) ||
            slugify(mapped.externalSku) ||
            slugify(mapped.externalId);
          const slug = await uniqueSlug(tx, baseSlug, mapped.externalId);
          const created = await tx.product.create({
            data: {
              ...productData,
              slug,
              categories: { connect: categoryIds.map((id) => ({ id })) },
              sourceCategories: {
                connect: sourceCategoryIds.map((id) => ({ id })),
              },
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
  ): Promise<{ categoryIds: string[]; sourceCategoryIds: string[] }> {
    if (!categories.length) return { categoryIds: [], sourceCategoryIds: [] };
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
        select: { id: true, categoryId: true },
      });
      const ids = new Set<string>();
      const sourceCategoryIds: string[] = [];
      for (const m of mapped) {
        sourceCategoryIds.push(m.id);
        if (m.categoryId) ids.add(m.categoryId);
      }
      return { categoryIds: [...ids], sourceCategoryIds };
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
    return { categoryIds: [...ids], sourceCategoryIds: [] };
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
