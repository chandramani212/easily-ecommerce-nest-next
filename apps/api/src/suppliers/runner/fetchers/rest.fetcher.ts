import { AuthAdapter, RequestPlan } from '../auth';
import { FetchedPayload, Fetcher } from './fetcher';

export interface RestFetcherConfig {
  baseUrl?: string | null;
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
  /** Hard cap to protect against runaway responses. Defaults to 50 MB. */
  maxBytes?: number;
  /** Per-request timeout in ms. Defaults to 60 s. */
  timeoutMs?: number;
}

export class RestFetcher implements Fetcher {
  constructor(
    private readonly cfg: RestFetcherConfig,
    private readonly auth: AuthAdapter,
  ) {}

  async fetch(): Promise<FetchedPayload> {
    const url = resolveUrl(this.cfg.baseUrl, this.cfg.endpoint);
    const initialPlan: RequestPlan = {
      url,
      headers: { Accept: '*/*', ...(this.cfg.headers ?? {}) },
    };
    const plan = await this.auth.apply(initialPlan);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.cfg.timeoutMs ?? 60_000,
    );
    try {
      const res = await fetch(plan.url, {
        method: (this.cfg.method ?? 'GET').toUpperCase(),
        headers: plan.headers,
        body: this.cfg.body ?? undefined,
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(`Supplier fetch failed (${res.status}): ${text}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const max = this.cfg.maxBytes ?? 50 * 1024 * 1024;
      if (buf.length > max) {
        throw new Error(
          `Supplier response exceeds maxBytes (${buf.length} > ${max})`,
        );
      }
      return {
        body: buf,
        contentType: res.headers.get('content-type') ?? undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function resolveUrl(baseUrl: string | null | undefined, endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (!baseUrl) {
    throw new Error('Supplier baseUrl is required when endpoint is relative');
  }
  return new URL(endpoint, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 500);
  } catch {
    return '<no body>';
  }
}
