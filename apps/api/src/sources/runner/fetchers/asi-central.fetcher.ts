import { Logger } from '@nestjs/common';

import { AuthAdapter, RequestPlan } from '../auth';
import { FetchedPayload, Fetcher } from './fetcher';

export interface AsiCentralFetcherConfig {
  /** Defaults to https://api.uat-asicentral.com */
  baseUrl?: string | null;
  /**
   * Optional search query passed as `q`. When unset, an empty `q=` is sent so
   * ASI returns the full catalog rather than filtering on the literal term "null".
   */
  searchQuery?: string | null;
  /** Hard cap on how many list pages to walk. Defaults to 5000. */
  maxPages?: number;
  /** Cap on total detail records pulled. Defaults to 200000. */
  maxRecords?: number;
  /** Per-request timeout in ms. Defaults to 60 s. */
  timeoutMs?: number;
  /**
   * Base wait before retrying a transient request failure (network error, abort
   * timeout, or 5xx). Grows exponentially per attempt. Defaults to 1 s. Exposed
   * mainly so tests can drive the retry path without real-time waits.
   */
  transientRetryBaseMs?: number;
  /** Base backoff between full search walks. Defaults to 500 ms. */
  retryBackoffMs?: number;
  /** How many full search walks to attempt, merging unique ids. Defaults to 3. */
  maxSearchWalks?: number;
  /**
   * How many detail requests to run in parallel. ASI detail fetches are one HTTP
   * round trip each, so a large catalog is I/O-bound — a small pool cuts a
   * multi-hour sequential walk to minutes. Defaults to 16.
   */
  detailConcurrency?: number;
  /**
   * Called during the detail-fetch phase with how many details have been pulled
   * so far and the total to pull. Lets the runner surface download progress
   * (the longest phase) instead of an opaque "fetching…". Best-effort.
   */
  onFetchProgress?: (fetched: number, total: number) => void;
  /**
   * When set, the fetcher streams detail records to this callback in batches as
   * they are downloaded, instead of buffering the entire catalog and returning
   * it all at once. Lets the runner map + upsert products incrementally so rows
   * appear as the run progresses and a mid-run crash keeps what was already
   * written. When provided, `fetch()` resolves with an empty `records` envelope
   * (everything was handed off via the callback). Awaited, so it also applies
   * backpressure. Batches are flushed serially in arrival order.
   */
  onBatch?: (records: unknown[]) => Promise<void>;
  /** Detail records per streamed batch (see `onBatch`). Defaults to 50. */
  batchSize?: number;
  /**
   * Ids whose detail fetch should be skipped — typically products already
   * imported. Lets a re-run pull only the catalog it's missing (fast, additive
   * "resume"): collection still walks cheaply, but no detail request/upsert is
   * spent on an id we already have. Skipped ids are also excluded from progress.
   */
  skipDetailIds?: ReadonlySet<string>;
  /**
   * Results per search page (`rpp`). ASI caps this at 100. Larger pages mean the
   * whole result set is read in 1–2 requests from a single backend replica,
   * which sidesteps the per-page total drift seen when stitching many small
   * pages across replicas. Defaults to 100.
   */
  resultsPerPage?: number;
}

interface AsiSearchResponse {
  /** ASI returns the result array under several possible keys across endpoints. */
  Results?: AsiProductSummary[];
  results?: AsiProductSummary[];
  Products?: AsiProductSummary[];
  products?: AsiProductSummary[];
  Data?: AsiProductSummary[];
  data?: AsiProductSummary[];
  /** Optional metadata; absence is fine — we stop on empty page. */
  page?: number;
  Page?: number;
  total_pages?: number;
  totalPages?: number;
  ResultsTotal?: number;
  ResultsPerPage?: number;
}

interface AsiProductSummary {
  /** ASI's numeric product id. Some payloads use `Id`. */
  id?: number | string;
  Id?: number | string;
  product_id?: number | string;
}

/** A facet bucket from a `dl=<dim>_all` response (under `Dimensions.<Plural>`). */
interface AsiFacetBucket {
  /** Filter value to pass as `dim:<value>`; ASI uses ContextPath for this. */
  ContextPath?: string;
  Name?: string;
  Value?: string;
  /** Reliable product count for the bucket (with `IsExhaustive: true`). */
  Products?: number;
  Count?: number;
  IsExhaustive?: boolean;
}

const DEFAULT_BASE_URL = 'https://api.uat-asicentral.com/v1';
const SEARCH_PATH = '/products/search.json';
const DETAIL_PATH = (id: string) => `/products/${id}.json`;
/** ASI's hard cap on the `rpp` (results-per-page) parameter. */
const MAX_RESULTS_PER_PAGE = 100;

/** Default number of full search walks to attempt, merging unique ids across them. */
const DEFAULT_MAX_SEARCH_WALKS = 3;

/** Default parallelism for the detail-fetch phase. */
const DEFAULT_DETAIL_CONCURRENCY = 16;

/** Report detail-fetch progress at most this often (every N records). */
const DETAIL_PROGRESS_EVERY = 100;

/** Default detail records per streamed batch when `onBatch` is used. */
const DEFAULT_BATCH_SIZE = 50;

/** Upper bound of the price axis for recursive `price:[lo to hi]` bisection. */
const MAX_PRICE = 1_000_000;
/**
 * Narrowest price band we'll bisect to. Below this width a band that's still
 * over the cap is a same-price cluster, so we fall back to facet partitioning
 * for it rather than splitting the price further.
 */
const MIN_PRICE_WIDTH = 1;

/** How many times to wait-and-retry a single request throttled with HTTP 429. */
const RATE_LIMIT_MAX_RETRIES = 8;
/** Fallback wait when a 429 carries no usable reset/Retry-After header. */
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000;
/** Cap on any single 429 wait, so a bad header can't stall a run indefinitely. */
const MAX_RATE_LIMIT_WAIT_MS = 15 * 60_000;

/** How many times to retry a transient request failure (network error / 5xx). */
const TRANSIENT_MAX_RETRIES = 5;
/** Base wait before the first transient retry; doubles each subsequent attempt. */
const DEFAULT_TRANSIENT_RETRY_BASE_MS = 1_000;
/** Cap on any single transient-retry wait. */
const MAX_TRANSIENT_RETRY_WAIT_MS = 30_000;

/**
 * Two-step fetcher for ASI Central:
 *   1. Walk paginated /v1/products/search.json to collect unique product ids.
 *   2. Per unique id, fetch /v1/products/{id}.json.
 *
 * Emits a synthetic JSON Buffer of shape `{ "records": [<detail>, ...] }` so
 * the existing JsonParser + mapper pipeline handles the rest. The runner pins
 * `recordsPath = "$.records"` and `format = JSON` for ASI_CENTRAL imports.
 *
 * ASI's search endpoint is not deterministic: it appears to serve requests from
 * multiple backend replicas that aren't fully in sync, so the reported
 * `ResultsTotal` drifts request-to-request and a paginated pass can end early.
 * Two things keep coverage high:
 *   - `rpp=100` (max page size) reads the whole result set in 1–2 requests from
 *     a single replica, avoiding the per-page drift you get stitching many small
 *     pages together.
 *   - up to `maxSearchWalks` full walks whose unique ids are merged recover the
 *     rest when a walk lands on a replica that served a short set. Each walk
 *     pages until the results genuinely run out — it never stops at the reported
 *     `ResultsTotal`, which ASI under-reports and which would truncate the sync.
 * Ids are de-duplicated across pages and walks so overlap never triggers a
 * redundant detail fetch. A single run is still best-effort — but the importer
 * never deletes products it didn't see (unless `autoDeactivateMissing` is on),
 * so repeated scheduled runs accumulate the full catalog over time.
 */
export class AsiCentralFetcher implements Fetcher {
  private readonly logger = new Logger(AsiCentralFetcher.name);

  /** ASI's hard per-query result ceiling; slices at/under this are walkable in full. */
  private static readonly SLICE_CAP = 1000;
  /**
   * Facet dimensions to partition the catalog by, in order. Each has a `dl`
   * list and an embeddable `dim:value` filter. `supplier` is second because
   * every product has exactly one supplier (clean, non-overlapping split);
   * the rest subdivide stubborn slices further.
   */
  private static readonly PARTITION_DIMS = [
    'category',
    'supplier',
    'theme',
    'color',
    'material',
    'size',
    'shape',
  ];

  constructor(
    private readonly cfg: AsiCentralFetcherConfig,
    private readonly auth: AuthAdapter,
  ) {}

  async fetch(): Promise<FetchedPayload> {
    const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const maxPages = this.cfg.maxPages ?? 5000;
    const maxRecords = this.cfg.maxRecords ?? 200000;
    const q = this.cfg.searchQuery ?? '';
    const timeoutMs = this.cfg.timeoutMs ?? 60_000;
    const backoffMs = this.cfg.retryBackoffMs ?? 500;

    const streaming = typeof this.cfg.onBatch === 'function';
    const batchSize = Math.max(1, this.cfg.batchSize ?? DEFAULT_BATCH_SIZE);
    const detailConcurrency = Math.max(
      1,
      this.cfg.detailConcurrency ?? DEFAULT_DETAIL_CONCURRENCY,
    );

    // ---- Shared batch-streaming machinery. ----
    let pending: unknown[] = [];
    // Flush batches serially so the runner's counter updates and DB writes never
    // interleave, even though detail workers complete concurrently.
    let flushChain: Promise<void> = Promise.resolve();
    const flush = (records: unknown[]): Promise<void> => {
      flushChain = flushChain.then(() => this.cfg.onBatch!(records));
      return flushChain;
    };
    let streamed = 0; // detail records streamed so far
    let discovered = 0; // ids discovered so far (the growing denominator)

    /** Fetch details for a set of ids through a bounded pool, streaming batches. */
    const streamDetails = async (idList: string[]): Promise<void> => {
      let cursor = 0;
      const worker = async (): Promise<void> => {
        for (;;) {
          const i = cursor;
          cursor += 1;
          if (i >= idList.length) return;
          const id = idList[i];
          let record: unknown;
          try {
            record = await this.getJson(`${baseUrl}${DETAIL_PATH(id)}`, timeoutMs);
          } catch (err) {
            record = {
              __asiFetchError: true,
              id,
              error: err instanceof Error ? err.message : String(err),
            };
          }
          pending.push(record);
          streamed += 1;
          if (pending.length >= batchSize) {
            const slice = pending;
            pending = [];
            await flush(slice);
          }
          if (streamed % DETAIL_PROGRESS_EVERY === 0) {
            this.cfg.onFetchProgress?.(streamed, discovered);
          }
        }
      };
      const c = Math.max(1, Math.min(detailConcurrency, idList.length || 1));
      await Promise.all(Array.from({ length: c }, () => worker()));
      this.cfg.onFetchProgress?.(streamed, discovered);
    };

    // Streaming mode interleaves collection and detail-fetch: each slice's
    // product details are downloaded and streamed AS its ids are discovered, so
    // products land within the first minute instead of after the entire (slow,
    // rate-limited) id-collection phase completes. The denominator grows as more
    // ids surface. Non-streaming leaves this hook unset and buffers below.
    const skip = this.cfg.skipDetailIds;
    const keep = (id: string): boolean => !skip || !skip.has(id);

    const onIds = streaming
      ? async (newIds: string[]): Promise<void> => {
          // Drop ids we already have so a re-run spends no detail request on them.
          const fresh = newIds.filter(keep);
          if (!fresh.length) return;
          discovered += fresh.length;
          this.cfg.onFetchProgress?.(streamed, discovered);
          await streamDetails(fresh);
        }
      : undefined;

    const ids = await this.collectIds(
      baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs, onIds,
    );

    if (streaming) {
      if (pending.length) await flush(pending.splice(0));
      await flushChain;
      this.logger.log(`ASI fetch complete: ${streamed} detail records streamed`);
      return {
        body: Buffer.from(JSON.stringify({ records: [] }), 'utf8'),
        contentType: 'application/json',
      };
    }

    // ---- Non-streaming (dry-run previews, tests): buffer all details, once. ----
    const targets = ids.filter(keep).slice(0, maxRecords);
    const details: unknown[] = new Array(targets.length);
    this.cfg.onFetchProgress?.(0, targets.length);
    let cursor = 0;
    let completed = 0;
    const worker = async (): Promise<void> => {
      for (;;) {
        const i = cursor;
        cursor += 1;
        if (i >= targets.length) return;
        const id = targets[i];
        try {
          details[i] = await this.getJson(`${baseUrl}${DETAIL_PATH(id)}`, timeoutMs);
        } catch (err) {
          details[i] = {
            __asiFetchError: true,
            id,
            error: err instanceof Error ? err.message : String(err),
          };
        }
        completed += 1;
        if (
          completed % DETAIL_PROGRESS_EVERY === 0 ||
          completed === targets.length
        ) {
          this.cfg.onFetchProgress?.(completed, targets.length);
        }
      }
    };
    const concurrency = Math.max(1, Math.min(detailConcurrency, targets.length || 1));
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    this.logger.log(`ASI fetch complete: ${details.length} detail records`);
    const body = Buffer.from(JSON.stringify({ records: details }), 'utf8');
    return { body, contentType: 'application/json' };
  }

  /**
   * Collect every ASI product id in one category — ids only, no detail fetches.
   * `categoryValue` is the ASI ContextPath (e.g. "T-SHIRTS", "T-Shirts-Mens").
   * Bounded price-bisection scoped to the category; NEVER falls back to facet
   * partitioning, so a band over the cap but too narrow to split is just walked
   * (first ≤1000 taken). Used by the product category backfill.
   */
  async collectCategoryProductIds(categoryValue: string): Promise<string[]> {
    const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const maxPages = this.cfg.maxPages ?? 5000;
    const maxRecords = this.cfg.maxRecords ?? 200_000;
    const timeoutMs = this.cfg.timeoutMs ?? 60_000;
    const backoffMs = this.cfg.retryBackoffMs ?? 500;
    const seen = new Set<string>();
    const ordered: string[] = [];
    const CAP = AsiCentralFetcher.SLICE_CAP;

    const collect = async (lo: number, hi: number): Promise<void> => {
      if (ordered.length >= maxRecords) return;
      const priceSel =
        lo === 0 && hi === MAX_PRICE
          ? ''
          : ` price:[${round2(lo)} to ${round2(hi)}]`;
      const q = `category:${categoryValue}${priceSel}`;
      const width = hi - lo;
      const mid = round2(lo + width / 2);
      const splittable = width > MIN_PRICE_WIDTH && mid > lo && mid < hi;

      const count = await this.getCount(baseUrl, q, timeoutMs);
      if (count > CAP && splittable) {
        await collect(lo, mid);
        await collect(mid, hi);
        return;
      }
      const before = ordered.length;
      await this.walkFilter(
        baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered,
      );
      if (ordered.length - before >= CAP && splittable) {
        await collect(lo, mid);
        await collect(mid, hi);
      }
    };

    await collect(0, MAX_PRICE);
    this.logger.log(
      `ASI collectCategoryProductIds(${categoryValue}): ${ordered.length} ids`,
    );
    return ordered;
  }

  /**
   * Collect the ordered list of unique product ids.
   *
   * ASI's search endpoint hard-caps any single query at 1000 results (10 pages ×
   * rpp 100; page 11 returns empty), while reporting a far larger `ResultsTotal`.
   * So a naive walk of `q=<all>` can never return more than 1000 products.
   *
   *  - When an explicit `searchQuery` is configured, the user has intentionally
   *    narrowed the set: walk that single filter (also the unit-tested path).
   *  - Otherwise (full-catalog pull) recursively partition the catalog by facet
   *    dimensions (`dl=<dim>_all` gives per-bucket counts) until each slice is
   *    under the 1000 cap, then walk each slice. Ids are de-duped across the
   *    overlapping slices.
   */
  private async collectIds(
    baseUrl: string,
    q: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    backoffMs: number,
    onIds?: (newIds: string[]) => Promise<void>,
  ): Promise<string[]> {
    const seen = new Set<string>();
    const ordered: string[] = [];

    const userQuery = (q ?? '').trim();
    if (userQuery) {
      await this.walkFilter(
        baseUrl, userQuery, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
      );
      return ordered;
    }

    // Full-catalog pull: bisect the price axis until each band is under ASI's
    // 1000-result cap, then walk it. Price is continuous and (nearly) every
    // product has one, so this covers products regardless of category — unlike
    // facet-first partitioning, which misses category-less products and truncates
    // oversized facet leaves. Facet partitioning remains the fallback for a band
    // too narrow to split that's still over the cap (a same-price cluster).
    await this.partitionByPrice(
      0, MAX_PRICE, [], baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
    );
    this.logger.log(
      `ASI collectIds: ${ordered.length} unique ids after price partitioning`,
    );
    return ordered;
  }

  /**
   * Recursively bisect a price band until it's under the 1000-result cap, then
   * walk it. `selections` carries any outer facet filters (empty at the root).
   * Uses ASI's (noisy) `ResultsTotal` to decide splits, plus a post-walk guard:
   * if a "leaf" walk actually surfaced ~cap ids, `ResultsTotal` under-reported
   * and the band is re-split so nothing is silently truncated.
   */
  private async partitionByPrice(
    lo: number,
    hi: number,
    selections: { dim: string; value: string }[],
    baseUrl: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    backoffMs: number,
    seen: Set<string>,
    ordered: string[],
    onIds?: (newIds: string[]) => Promise<void>,
  ): Promise<void> {
    if (ordered.length >= maxRecords) return;
    const band = { dim: 'price', value: `[${round2(lo)} to ${round2(hi)}]` };
    const sel = [...selections, band];
    const q = buildSelectionQuery(sel);
    const width = hi - lo;
    const mid = round2(lo + width / 2);
    const splittable = width > MIN_PRICE_WIDTH && mid > lo && mid < hi;

    const count = await this.getCount(baseUrl, q, timeoutMs);

    if (count > AsiCentralFetcher.SLICE_CAP) {
      if (splittable) {
        await this.partitionByPrice(
          lo, mid, selections, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
        await this.partitionByPrice(
          mid, hi, selections, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      } else {
        // Can't narrow the price further — split this band by facet dimensions.
        await this.partition(
          sel, 0, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      }
      return;
    }

    // Under the cap (or ASI won't give a bigger number): walk it.
    const before = ordered.length;
    await this.walkFilter(
      baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
    );
    // Under-report guard: a full-cap harvest means there were more than reported.
    if (ordered.length - before >= AsiCentralFetcher.SLICE_CAP && splittable) {
      await this.partitionByPrice(
        lo, mid, selections, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
      );
      await this.partitionByPrice(
        mid, hi, selections, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
      );
    }
  }

  /** ASI's reported total for a query (page 1, rpp 1). 0 on error/absent. */
  private async getCount(
    baseUrl: string,
    q: string,
    timeoutMs: number,
  ): Promise<number> {
    const url = `${baseUrl}${SEARCH_PATH}?page=1&rpp=1&q=${encodeURIComponent(q)}`;
    try {
      return readResultsTotal(await this.getJson(url, timeoutMs)) ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Recursively partition the catalog by facet dimensions until each slice fits
   * under ASI's 1000-result cap, walking each leaf slice. `selections` is the
   * chain of `dim:value` filters applied so far; `dimIdx` indexes PARTITION_DIMS.
   */
  private async partition(
    selections: { dim: string; value: string }[],
    dimIdx: number,
    baseUrl: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    backoffMs: number,
    seen: Set<string>,
    ordered: string[],
    onIds?: (newIds: string[]) => Promise<void>,
  ): Promise<void> {
    if (ordered.length >= maxRecords) return;
    const dims = AsiCentralFetcher.PARTITION_DIMS;
    const dim = dims[dimIdx];
    const buckets = await this.getBuckets(baseUrl, selections, dim, timeoutMs);

    // No buckets for this dimension under these selections: try the next
    // dimension, or (out of dimensions) just walk what the current filter yields.
    if (buckets.length === 0) {
      if (dimIdx + 1 < dims.length) {
        await this.partition(
          selections, dimIdx + 1, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      } else {
        await this.walkFilter(
          baseUrl, buildSelectionQuery(selections), maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      }
      return;
    }

    for (const bucket of buckets) {
      if (ordered.length >= maxRecords) return;
      const child = [...selections, { dim, value: bucket.value }];
      const q = buildSelectionQuery(child);
      if (bucket.count <= AsiCentralFetcher.SLICE_CAP) {
        await this.walkFilter(
          baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      } else if (dimIdx + 1 < dims.length) {
        await this.partition(
          child, dimIdx + 1, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
      } else {
        // Still over the cap with no dimensions left to split by — walk anyway;
        // this slice will be truncated to the first 1000. Logged so it's visible.
        const before = ordered.length;
        await this.walkFilter(
          baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds,
        );
        this.logger.warn(
          `ASI slice still >${AsiCentralFetcher.SLICE_CAP} (count ~${bucket.count}) ` +
            `with no more split dimensions: "${q}" — truncated, +${ordered.length - before} ids`,
        );
      }
    }
  }

  /**
   * Fetch the facet buckets for `dim` under the current `selections` via
   * `dl=<dim>_all`. Each bucket carries a reliable `Products` count (unlike the
   * noisy top-level `ResultsTotal`). Returns [] on any error or empty facet.
   */
  private async getBuckets(
    baseUrl: string,
    selections: { dim: string; value: string }[],
    dim: string,
    timeoutMs: number,
  ): Promise<{ value: string; count: number }[]> {
    const q = buildSelectionQuery(selections);
    const url =
      `${baseUrl}${SEARCH_PATH}?page=1&rpp=1&q=${encodeURIComponent(q)}&dl=${dim}_all`;
    let json: unknown;
    try {
      json = await this.getJson(url, timeoutMs);
    } catch (err) {
      this.logger.warn(
        `ASI facet fetch failed for dl=${dim} q="${q}": ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
    const dimsObj = (json as { Dimensions?: unknown } | null)?.Dimensions;
    if (!dimsObj || typeof dimsObj !== 'object') return [];
    // Requesting a single dl returns one array under a plural key (e.g. Categories).
    const arr = Object.values(dimsObj as Record<string, unknown>).find((v) =>
      Array.isArray(v),
    ) as AsiFacetBucket[] | undefined;
    if (!arr) return [];

    const out: { value: string; count: number }[] = [];
    for (const b of arr) {
      const value = b?.ContextPath ?? b?.Name ?? b?.Value;
      if (typeof value === 'string' && value.length > 0) {
        out.push({ value, count: Number(b?.Products ?? b?.Count ?? 0) || 0 });
      }
    }
    return out;
  }

  /**
   * Walk a single search filter across up to `maxSearchWalks` full passes,
   * merging unique ids into the shared `seen`/`ordered`. Each pass pages until
   * the results genuinely run out (empty page) — never at ASI's reported total,
   * which drifts. Re-walks recover ids when one pass lands on a short replica.
   */
  private async walkFilter(
    baseUrl: string,
    q: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    backoffMs: number,
    seen: Set<string>,
    ordered: string[],
    onIds?: (newIds: string[]) => Promise<void>,
  ): Promise<void> {
    const maxWalks = Math.max(1, this.cfg.maxSearchWalks ?? DEFAULT_MAX_SEARCH_WALKS);
    let reportedMax: number | undefined;

    for (let walk = 1; walk <= maxWalks; walk += 1) {
      const before = ordered.length;
      const walkTotal = await this.walkOnce(
        baseUrl, q, maxPages, maxRecords, timeoutMs, seen, ordered, onIds,
      );
      if (walkTotal !== undefined) {
        reportedMax =
          reportedMax === undefined ? walkTotal : Math.max(reportedMax, walkTotal);
      }
      const added = ordered.length - before;
      this.logger.log(
        `ASI walk ${walk}/${maxWalks} q="${q || '(all)'}": ${ordered.length} unique ` +
          `(+${added}${reportedMax ? `, ASI reported ~${reportedMax}` : ''})`,
      );

      if (ordered.length >= maxRecords) break;
      if (walk > 1 && added === 0) break; // converged
      if (walk < maxWalks) await delay(backoffMs * walk);
    }
  }

  /**
   * One full pass over the paginated search endpoint, adding any newly-seen ids
   * to `seen`/`ordered`. Returns the largest `ResultsTotal` ASI reported during
   * the pass (for logging only — it is NOT used to decide when to stop).
   *
   * The pass keeps paging until a *reliable* end-of-data signal:
   *   - an empty page (the true end of results), or
   *   - a non-first page that returned rows but no new ids (pagination looping).
   * It deliberately does NOT stop once `ordered.length` reaches the reported
   * `ResultsTotal`: ASI under-reports that number, so trusting it truncates the
   * sync before the catalog is fully pulled.
   */
  private async walkOnce(
    baseUrl: string,
    q: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    seen: Set<string>,
    ordered: string[],
    onIds?: (newIds: string[]) => Promise<void>,
  ): Promise<number | undefined> {
    let reportedMax: number | undefined;
    const rpp = Math.min(
      MAX_RESULTS_PER_PAGE,
      Math.max(1, this.cfg.resultsPerPage ?? MAX_RESULTS_PER_PAGE),
    );

    for (let page = 1; page <= maxPages && ordered.length < maxRecords; page += 1) {
      const url = `${baseUrl}${SEARCH_PATH}?page=${page}&q=${encodeURIComponent(q)}&rpp=${rpp}`;
      const json = await this.getJson(url, timeoutMs);
      const reported = readResultsTotal(json);
      if (reported !== undefined) {
        reportedMax =
          reportedMax === undefined ? reported : Math.max(reportedMax, reported);
      }

      const summaries = extractSummaries(json);
      const before = ordered.length;
      for (const summary of summaries) {
        const id = pickId(summary);
        if (id && !seen.has(id)) {
          seen.add(id);
          ordered.push(id);
        }
      }
      const added = ordered.length - before;
      this.logger.log(
        `ASI search page ${page}: ${summaries.length} summaries, ${added} new ` +
          `(${ordered.length} unique${reportedMax ? `, ASI total ~${reportedMax}` : ''}, q=${q})`,
      );

      // Hand this page's newly-discovered ids off for immediate detail streaming
      // (interleaved mode). Awaited, so collection self-throttles behind the
      // detail fetches and the shared rate-limit budget isn't double-spent.
      if (onIds && added > 0) await onIds(ordered.slice(before));

      if (summaries.length === 0) break; // true end of results
      if (page > 1 && added === 0) break; // pagination looping / exhausted
    }

    return reportedMax;
  }

  private async getJson(url: string, timeoutMs: number): Promise<unknown> {
    const plan = await this.auth.apply({
      url,
      headers: { Accept: 'application/json' },
    });

    const transientBase =
      this.cfg.transientRetryBaseMs ?? DEFAULT_TRANSIENT_RETRY_BASE_MS;
    // Two independent retry budgets:
    //  - 429 (rate limit): wait out the reset window; a full-catalog pull
    //    inevitably brushes the 5000/hr quota, and this self-paces concurrent
    //    detail fetches down to the sustainable rate.
    //  - transient failures (network throw, abort-timeout, or 5xx): a run issues
    //    thousands of requests over many minutes, so a lone ECONNRESET / socket
    //    timeout / DNS blip is near-certain. Retry with exponential backoff
    //    instead of letting one blip abort the whole multi-hour run.
    let rateLimitRetries = 0;
    let transientRetries = 0;
    for (;;) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(plan.url, {
          method: 'GET',
          headers: plan.headers,
          signal: controller.signal,
        });
      } catch (err) {
        // fetch() itself rejected (network error or our abort timeout). Retry
        // with backoff until the budget is exhausted, then surface the real
        // cause — undici hides it under `err.cause`, not the bare "fetch failed".
        transientRetries += 1;
        if (transientRetries > TRANSIENT_MAX_RETRIES) {
          throw new Error(
            `ASI request failed for ${url} after ${TRANSIENT_MAX_RETRIES} ` +
              `retries: ${describeError(err)}`,
          );
        }
        const waitMs = transientBackoffMs(transientRetries, transientBase);
        this.logger.warn(
          `ASI request error (${describeError(err)}); retry ` +
            `${transientRetries}/${TRANSIENT_MAX_RETRIES} in ` +
            `${Math.round(waitMs / 1000)}s — ${url}`,
        );
        await delay(waitMs);
        continue;
      } finally {
        clearTimeout(timeout);
      }

      if (res.status === 429 && rateLimitRetries < RATE_LIMIT_MAX_RETRIES) {
        rateLimitRetries += 1;
        const waitMs = rateLimitWaitMs(res);
        this.logger.warn(
          `ASI rate limited (429); waiting ${Math.round(waitMs / 1000)}s then ` +
            `retrying (attempt ${rateLimitRetries}/${RATE_LIMIT_MAX_RETRIES}) — ${url}`,
        );
        await delay(waitMs);
        continue;
      }

      // 5xx is a transient server-side failure: retry on the same budget as
      // network errors rather than aborting the run on a momentary ASI hiccup.
      if (res.status >= 500 && transientRetries < TRANSIENT_MAX_RETRIES) {
        transientRetries += 1;
        const waitMs = transientBackoffMs(transientRetries, transientBase);
        this.logger.warn(
          `ASI server error (${res.status}); retry ` +
            `${transientRetries}/${TRANSIENT_MAX_RETRIES} in ` +
            `${Math.round(waitMs / 1000)}s — ${url}`,
        );
        await delay(waitMs);
        continue;
      }

      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(`ASI fetch failed (${res.status}) for ${url}: ${text}`);
      }
      return (await res.json()) as unknown;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Round to cents so price-band bounds stay clean across recursive bisection. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Exponential backoff for the Nth transient retry (1-based), capped. */
function transientBackoffMs(attempt: number, baseMs: number): number {
  return Math.min(MAX_TRANSIENT_RETRY_WAIT_MS, baseMs * 2 ** (attempt - 1));
}

/**
 * Human-readable error string. undici's `fetch()` rejects with a generic
 * `TypeError: fetch failed` and stashes the real reason (ECONNRESET, socket
 * timeout, DNS failure) under `.cause` — surface it so failures are diagnosable.
 */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    const causeMsg =
      cause instanceof Error ? cause.message : cause ? String(cause) : '';
    return causeMsg ? `${err.message} (${causeMsg})` : err.message;
  }
  return String(err);
}

/**
 * How long to wait after a 429, from response headers. Honors `Retry-After`
 * (seconds) and ASI's `X-Rate-Limit-Reset`, which may be either a duration in
 * seconds or an absolute epoch-seconds timestamp. Clamped to a sane range.
 */
function rateLimitWaitMs(res: Response): number {
  const clamp = (ms: number): number =>
    Math.min(MAX_RATE_LIMIT_WAIT_MS, Math.max(1_000, ms));

  const retryAfter = Number(res.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return clamp(retryAfter * 1000);

  const reset = Number(res.headers.get('x-rate-limit-reset'));
  if (Number.isFinite(reset) && reset > 0) {
    // Values larger than a day of seconds are almost certainly an epoch stamp.
    const asEpochMs = reset * 1000 - Date.now();
    const ms = reset > 86_400 ? asEpochMs : reset * 1000;
    if (ms > 0) return clamp(ms);
  }
  return DEFAULT_RATE_LIMIT_WAIT_MS;
}

/**
 * Build the `q` value for a chain of facet selections, e.g.
 * `[{category:AWARDS},{supplier:SRG (asi/84592)}]` → `category:AWARDS supplier:SRG (asi/84592)`.
 * ASI composes space-separated `dim:value` filters; encoding happens at the URL.
 */
function buildSelectionQuery(selections: { dim: string; value: string }[]): string {
  return selections.map((s) => `${s.dim}:${s.value}`).join(' ');
}

/** ASI's total match count for the query, across every page. Undefined if absent. */
function readResultsTotal(json: unknown): number | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const total = (json as AsiSearchResponse).ResultsTotal;
  return typeof total === 'number' && total >= 0 ? total : undefined;
}

function extractSummaries(json: unknown): AsiProductSummary[] {
  if (Array.isArray(json)) return json as AsiProductSummary[];
  if (!json || typeof json !== 'object') return [];
  const obj = json as Record<string, unknown>;
  // ASI Central returns PascalCase `Results`; other shapes kept for compatibility
  // with vendor variants and older mocks.
  for (const key of ['Results', 'results', 'Products', 'products', 'Data', 'data']) {
    const v = obj[key];
    if (Array.isArray(v)) return v as AsiProductSummary[];
  }
  return [];
}

function pickId(s: AsiProductSummary): string | null {
  const raw = s.id ?? s.Id ?? s.product_id;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 500);
  } catch {
    return '<no body>';
  }
}
