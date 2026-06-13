import { Logger } from '@nestjs/common';

import { AuthAdapter, RequestPlan } from '../auth';
import { FetchedPayload, Fetcher } from './fetcher';

export interface AsiCentralFetcherConfig {
  /** Defaults to https://api.uat-asicentral.com */
  baseUrl?: string | null;
  /** Optional search query passed as `q`. ASI accepts the literal string "null". */
  searchQuery?: string | null;
  /** Hard cap on how many list pages to walk. Defaults to 100. */
  maxPages?: number;
  /** Cap on total detail records pulled. Defaults to 5000. */
  maxRecords?: number;
  /** Per-request timeout in ms. Defaults to 60 s. */
  timeoutMs?: number;
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

/**
 * Two-step fetcher for ASI Central:
 *   1. Walk paginated /v1/products/search.json
 *   2. Per summary, fetch /v1/products/{id}.json
 *
 * Emits a synthetic JSON Buffer of shape `{ "records": [<detail>, ...] }` so
 * the existing JsonParser + mapper pipeline handles the rest. The runner pins
 * `recordsPath = "$.records"` and `format = JSON` for ASI_CENTRAL imports.
 */
export class AsiCentralFetcher implements Fetcher {
  private readonly logger = new Logger(AsiCentralFetcher.name);

  constructor(
    private readonly cfg: AsiCentralFetcherConfig,
    private readonly auth: AuthAdapter,
  ) {}

  async fetch(): Promise<FetchedPayload> {
    const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const maxPages = this.cfg.maxPages ?? 1;
    const maxRecords = this.cfg.maxRecords ?? 5000;
    const q = this.cfg.searchQuery ?? 'null';
    const timeoutMs = this.cfg.timeoutMs ?? 60_000;

    const details: unknown[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const url = `${baseUrl}${SEARCH_PATH}?page=${page}&q=${encodeURIComponent(q)}`;
      const json = await this.getJson(url, timeoutMs);
      const summaries = extractSummaries(json);
      this.logger.log(
        `ASI search page ${page}: ${summaries.length} summaries (q=${q})`,
      );
      if (!summaries.length) break;

      for (const summary of summaries) {
        const id = pickId(summary);
        if (!id) continue;
        const detailUrl = `${baseUrl}${DETAIL_PATH(id)}`;
        try {
          const detail = await this.getJson(detailUrl, timeoutMs);
          details.push(detail);
          if (details.length >= maxRecords) break;
        } catch (err) {
          details.push({
            __asiFetchError: true,
            id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      if (details.length >= maxRecords) break;

      const resp = json as AsiSearchResponse;
      const totalPages =
        resp.total_pages ??
        resp.totalPages ??
        (resp.ResultsTotal && resp.ResultsPerPage
          ? Math.ceil(resp.ResultsTotal / resp.ResultsPerPage)
          : undefined);
      if (totalPages && page >= totalPages) break;
    }

    this.logger.log(`ASI fetch complete: ${details.length} detail records`);
    const body = Buffer.from(JSON.stringify({ records: details }), 'utf8');
    return { body, contentType: 'application/json' };
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
