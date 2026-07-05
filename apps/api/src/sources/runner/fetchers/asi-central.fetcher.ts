import { Logger } from '@nestjs/common';

import { AuthAdapter, RequestPlan } from '../auth';
import { FetchedPayload, Fetcher } from './fetcher';

export interface AsiCentralFetcherConfig {
  /** Defaults to https://api.uat-asicentral.com */
  baseUrl?: string | null;
  /** Optional search query passed as `q`. ASI accepts the literal string "null". */
  searchQuery?: string | null;
  /** Hard cap on how many list pages to walk. Defaults to 1000. */
  maxPages?: number;
  /** Cap on total detail records pulled. Defaults to 50000. */
  maxRecords?: number;
  /** Per-request timeout in ms. Defaults to 60 s. */
  timeoutMs?: number;
  /** Base backoff between full search walks. Defaults to 500 ms. */
  retryBackoffMs?: number;
  /** How many full search walks to attempt, merging unique ids. Defaults to 3. */
  maxSearchWalks?: number;
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

const DEFAULT_BASE_URL = 'https://api.uat-asicentral.com/v1';
const SEARCH_PATH = '/products/search.json';
const DETAIL_PATH = (id: string) => `/products/${id}.json`;
/** ASI's hard cap on the `rpp` (results-per-page) parameter. */
const MAX_RESULTS_PER_PAGE = 100;

/** Default number of full search walks to attempt, merging unique ids across them. */
const DEFAULT_MAX_SEARCH_WALKS = 3;

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

  constructor(
    private readonly cfg: AsiCentralFetcherConfig,
    private readonly auth: AuthAdapter,
  ) {}

  async fetch(): Promise<FetchedPayload> {
    const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const maxPages = this.cfg.maxPages ?? 1000;
    const maxRecords = this.cfg.maxRecords ?? 50000;
    const q = this.cfg.searchQuery ?? 'null';
    const timeoutMs = this.cfg.timeoutMs ?? 60_000;
    const backoffMs = this.cfg.retryBackoffMs ?? 500;

    const ids = await this.collectIds(baseUrl, q, maxPages, maxRecords, timeoutMs, backoffMs);

    const details: unknown[] = [];
    for (const id of ids) {
      if (details.length >= maxRecords) break;
      const detailUrl = `${baseUrl}${DETAIL_PATH(id)}`;
      try {
        details.push(await this.getJson(detailUrl, timeoutMs));
      } catch (err) {
        details.push({
          __asiFetchError: true,
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    this.logger.log(`ASI fetch complete: ${details.length} detail records`);
    const body = Buffer.from(JSON.stringify({ records: details }), 'utf8');
    return { body, contentType: 'application/json' };
  }

  /**
   * Collect the ordered list of unique product ids across up to `maxSearchWalks`
   * full walks, merging results. Each walk pages until the results genuinely run
   * out (not until ASI's reported total). Re-walks until a whole walk surfaces no
   * new products (converged) or the walk cap is hit — this is what recovers the
   * rest when one walk lands on a replica that served a short/under-reported set.
   */
  private async collectIds(
    baseUrl: string,
    q: string,
    maxPages: number,
    maxRecords: number,
    timeoutMs: number,
    backoffMs: number,
  ): Promise<string[]> {
    const maxWalks = Math.max(1, this.cfg.maxSearchWalks ?? DEFAULT_MAX_SEARCH_WALKS);
    const seen = new Set<string>();
    const ordered: string[] = [];
    let reportedMax: number | undefined;

    for (let walk = 1; walk <= maxWalks; walk += 1) {
      const before = ordered.length;
      const walkTotal = await this.walkOnce(
        baseUrl, q, maxPages, maxRecords, timeoutMs, seen, ordered,
      );
      if (walkTotal !== undefined) {
        reportedMax =
          reportedMax === undefined ? walkTotal : Math.max(reportedMax, walkTotal);
      }
      const added = ordered.length - before;
      this.logger.log(
        `ASI search walk ${walk}/${maxWalks}: ${ordered.length} unique ids ` +
          `(+${added}${reportedMax ? `, ASI reported ~${reportedMax}` : ''})`,
      );

      if (ordered.length >= maxRecords) break;
      // Converged: a full extra walk surfaced no new products. We deliberately do
      // NOT stop just because we reached ASI's reported total — it under-reports,
      // and a further walk may hit a replica that serves more.
      if (walk > 1 && added === 0) break;
      if (walk < maxWalks) await delay(backoffMs * walk);
    }

    return ordered;
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

      if (summaries.length === 0) break; // true end of results
      if (page > 1 && added === 0) break; // pagination looping / exhausted
    }

    return reportedMax;
  }

  private async getJson(url: string, timeoutMs: number): Promise<unknown> {
    const initialPlan: RequestPlan = {
      url,
      headers: { Accept: 'application/json' },
    };
    const plan = await this.auth.apply(initialPlan);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(plan.url, {
        method: 'GET',
        headers: plan.headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(
          `ASI fetch failed (${res.status}) for ${url}: ${text}`,
        );
      }
      return (await res.json()) as unknown;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
