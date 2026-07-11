import { describe, it, expect, afterEach, jest } from '@jest/globals';

import { AuthAdapter, RequestPlan } from '../auth';
import { AsiCentralFetcher } from './asi-central.fetcher';

/** Pass-through auth so the fetcher runs without credentials. */
const noopAuth: AuthAdapter = { apply: async (p: RequestPlan) => p };

function jsonResponse(obj: unknown): Partial<Response> {
  return {
    ok: true,
    status: 200,
    json: async () => obj,
    text: async () => JSON.stringify(obj),
  };
}

function range(from: number, to: number): { Id: number }[] {
  const out: { Id: number }[] = [];
  for (let i = from; i <= to; i += 1) out.push({ Id: i });
  return out;
}

const BASE = 'https://asi.test/v1';

async function runFetch(): Promise<number[]> {
  const fetcher = new AsiCentralFetcher(
    { baseUrl: BASE, searchQuery: 'null', retryBackoffMs: 1, transientRetryBaseMs: 1 },
    noopAuth,
  );
  const payload = await fetcher.fetch();
  const parsed = JSON.parse(payload.body.toString('utf8')) as {
    records: { Id: number }[];
  };
  return parsed.records.map((r) => r.Id);
}

/** URLs hit for a specific product detail. */
function detailCalls(mock: jest.Mock, id: number): number {
  return mock.mock.calls.filter((c) =>
    String(c[0]).includes(`/products/${id}.json`),
  ).length;
}

describe('AsiCentralFetcher pagination', () => {
  let fetchMock: jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pages past an under-reported ResultsTotal instead of stopping at it', async () => {
    // ASI says ResultsTotal=100 but actually has 119 (page 2 carries the rest).
    // Stopping at the reported total would drop the extra 19 — the sync must not.
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        let results: { Id: number }[] = [];
        if (page === 1) results = range(1, 100);
        else if (page === 2) results = range(101, 119);
        return jsonResponse({
          Results: results,
          ResultsTotal: 100, // under-reported
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 119).map((r) => r.Id));
  });

  it('merges across walks to recover when one walk returns a short set', async () => {
    // First walk lands on a replica serving only 1..50; a later walk serves all
    // 1..119. Merging across walks recovers the full catalog.
    let walkIdx = 0;
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        if (page === 1) walkIdx += 1; // each walk restarts at page 1
        const full = walkIdx >= 2;
        let results: { Id: number }[] = [];
        if (full) {
          if (page === 1) results = range(1, 100);
          else if (page === 2) results = range(101, 119);
        } else if (page === 1) {
          results = range(1, 50);
        }
        return jsonResponse({
          Results: results,
          ResultsTotal: full ? 119 : 50,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 119).map((r) => r.Id));
  });

  it('de-duplicates ids that overlap across pages', async () => {
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        let results: { Id: number }[] = [];
        if (page === 1) results = range(1, 10);
        else if (page === 2) results = range(10, 19); // 10 repeats
        return jsonResponse({
          Results: results,
          ResultsTotal: 19,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 19).map((r) => r.Id));
    expect(detailCalls(fetchMock, 10)).toBe(1); // fetched once despite overlap
  });

  it('requests a large page (rpp=100) and collects the whole set', async () => {
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 89) : [];
        return jsonResponse({
          Results: results,
          ResultsTotal: 89,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids).toHaveLength(89);
    const searchCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('/products/search.json'),
    );
    expect(searchCalls.length).toBeGreaterThan(0);
    expect(searchCalls.every((c) => String(c[0]).includes('rpp=100'))).toBe(true);
  });

  it('retries a transient network error instead of aborting the whole run', async () => {
    // A full-catalog pull issues thousands of requests over many minutes; a lone
    // transient blip (undici throws `TypeError: fetch failed`) during the id
    // collection walk must not abort the entire run — getJson should retry it.
    let searchCalls = 0;
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        searchCalls += 1;
        if (searchCalls === 1) throw new TypeError('fetch failed');
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 5) : [];
        return jsonResponse({
          Results: results,
          ResultsTotal: 5,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 5).map((r) => r.Id));
  });

  it('retries a 5xx server error instead of aborting the whole run', async () => {
    let searchCalls = 0;
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        searchCalls += 1;
        if (searchCalls === 1) {
          return {
            ok: false,
            status: 503,
            json: async () => ({}),
            text: async () => 'service unavailable',
            headers: new Map() as unknown as Headers,
          } as Partial<Response>;
        }
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 3) : [];
        return jsonResponse({
          Results: results,
          ResultsTotal: 3,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 3).map((r) => r.Id));
  });

  it('stops on an empty page when ResultsTotal is absent', async () => {
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 5) : [];
        return jsonResponse({ Results: results }); // no ResultsTotal
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const ids = await runFetch();

    expect(ids.sort((a, b) => a - b)).toEqual(range(1, 5).map((r) => r.Id));
  });

  it('streams detail records via onBatch instead of buffering them', async () => {
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 25) : [];
        return jsonResponse({
          Results: results,
          ResultsTotal: 25,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const streamedIds: number[] = [];
    let batchCount = 0;
    const fetcher = new AsiCentralFetcher(
      {
        baseUrl: BASE,
        searchQuery: 'null',
        retryBackoffMs: 1,
        transientRetryBaseMs: 1,
        batchSize: 10,
        onBatch: async (recs) => {
          batchCount += 1;
          for (const r of recs) streamedIds.push((r as { Id: number }).Id);
        },
      },
      noopAuth,
    );

    const payload = await fetcher.fetch();
    const parsed = JSON.parse(payload.body.toString('utf8')) as {
      records: unknown[];
    };

    // Everything was handed off via onBatch, so the envelope is empty…
    expect(parsed.records).toEqual([]);
    // …and every product was streamed exactly once, across multiple batches.
    expect(streamedIds.sort((a, b) => a - b)).toEqual(
      range(1, 25).map((r) => r.Id),
    );
    expect(batchCount).toBeGreaterThanOrEqual(2);
  });

  it('price-partitions the full catalog past the 1000-cap, no truncation', async () => {
    // Model 1500 products, product k priced at exactly k. A search honours the
    // `price:[lo to hi]` filter and — like ASI — never returns more than 1000
    // rows for one query. Only correct price bisection recovers all 1500.
    const CAP = 1000;
    const N = 1500;
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const sp = new URL(u).searchParams;
        const q = sp.get('q') ?? '';
        const m = q.match(/price:\[(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)\]/);
        const lo = m ? Math.ceil(Number(m[1])) : 0;
        const hi = m ? Math.floor(Number(m[2])) : N;
        const idLo = Math.max(1, lo);
        const idHi = Math.min(N, hi);
        const all = idHi >= idLo ? range(idLo, idHi) : [];
        if (sp.get('rpp') === '1') {
          // count probe
          return jsonResponse({ Results: [], ResultsTotal: all.length, ResultsPerPage: 1 });
        }
        const page = Number(sp.get('page'));
        const capped = all.slice(0, CAP); // ASI's hard per-query ceiling
        const start = (page - 1) * 100;
        const slice = capped.slice(start, start + 100);
        return jsonResponse({
          Results: slice,
          ResultsTotal: all.length,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // Empty query → full-catalog price-bisection path.
    const fetcher = new AsiCentralFetcher(
      { baseUrl: BASE, searchQuery: '', retryBackoffMs: 1, transientRetryBaseMs: 1 },
      noopAuth,
    );
    const payload = await fetcher.fetch();
    const ids = (JSON.parse(payload.body.toString('utf8')) as { records: { Id: number }[] }).records
      .map((r) => r.Id)
      .sort((a, b) => a - b);

    expect(ids).toEqual(range(1, N).map((r) => r.Id));
  });

  it('skips ids already imported via skipDetailIds', async () => {
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const page = Number(new URL(u).searchParams.get('page'));
        const results = page === 1 ? range(1, 10) : [];
        return jsonResponse({ Results: results, ResultsTotal: 10, ResultsPerPage: 100, Page: page });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const fetcher = new AsiCentralFetcher(
      {
        baseUrl: BASE,
        searchQuery: 'null',
        retryBackoffMs: 1,
        transientRetryBaseMs: 1,
        skipDetailIds: new Set(['1', '2', '3', '4', '5']),
      },
      noopAuth,
    );
    const payload = await fetcher.fetch();
    const ids = (JSON.parse(payload.body.toString('utf8')) as { records: { Id: number }[] }).records
      .map((r) => r.Id)
      .sort((a, b) => a - b);

    // Only the 5 not-already-imported ids get detail-fetched.
    expect(ids).toEqual([6, 7, 8, 9, 10]);
    expect(detailCalls(fetchMock, 1)).toBe(0);
    expect(detailCalls(fetchMock, 6)).toBe(1);
  });

  it('collectCategoryProductIds lists all ids in a category past the 1000-cap, no detail fetch', async () => {
    const CAP = 1000;
    const N = 1500;
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const sp = new URL(u).searchParams;
        const q = sp.get('q') ?? '';
        if (!/category:PENS/.test(q)) {
          return jsonResponse({ Results: [], ResultsTotal: 0, ResultsPerPage: 1 });
        }
        const m = q.match(/price:\[(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)\]/);
        const lo = m ? Math.ceil(Number(m[1])) : 0;
        const hi = m ? Math.floor(Number(m[2])) : N;
        const all = range(Math.max(1, lo), Math.min(N, hi));
        if (sp.get('rpp') === '1') {
          return jsonResponse({ Results: [], ResultsTotal: all.length, ResultsPerPage: 1 });
        }
        const page = Number(sp.get('page'));
        const capped = all.slice(0, CAP);
        const start = (page - 1) * 100;
        return jsonResponse({
          Results: capped.slice(start, start + 100),
          ResultsTotal: all.length,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const fetcher = new AsiCentralFetcher(
      { baseUrl: BASE, retryBackoffMs: 1, transientRetryBaseMs: 1 },
      noopAuth,
    );
    const ids = (await fetcher.collectCategoryProductIds('PENS'))
      .map((s) => Number(s))
      .sort((a, b) => a - b);

    expect(ids).toEqual(range(1, N).map((r) => r.Id));
    const detailHits = fetchMock.mock.calls.filter((c) =>
      /\/products\/\d+\.json/.test(String(c[0])),
    ).length;
    expect(detailHits).toBe(0);
  });

  it('scopes the import to selected suppliers via asi/<externalId>', async () => {
    // Only supplier 143 has products; 999 has none. The full-catalog price
    // path is never taken — collection is driven by the asi/<id> prefix.
    fetchMock = jest.fn(async (url: unknown) => {
      const u = String(url);
      if (u.includes('/products/search.json')) {
        const sp = new URL(u).searchParams;
        const q = sp.get('q') ?? '';
        const all = /asi\/143/.test(q) ? range(1, 30) : [];
        if (sp.get('rpp') === '1') {
          return jsonResponse({ Results: [], ResultsTotal: all.length, ResultsPerPage: 1 });
        }
        const page = Number(sp.get('page'));
        return jsonResponse({
          Results: all.slice((page - 1) * 100, page * 100),
          ResultsTotal: all.length,
          ResultsPerPage: 100,
          Page: page,
        });
      }
      const m = u.match(/products\/(\d+)\.json/);
      return jsonResponse({ Id: Number(m![1]), Name: `P${m![1]}` });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const fetcher = new AsiCentralFetcher(
      {
        baseUrl: BASE,
        supplierScope: ['143', '999'],
        retryBackoffMs: 1,
        transientRetryBaseMs: 1,
      },
      noopAuth,
    );
    const payload = await fetcher.fetch();
    const ids = (JSON.parse(payload.body.toString('utf8')) as { records: { Id: number }[] }).records
      .map((r) => r.Id)
      .sort((a, b) => a - b);

    expect(ids).toEqual(range(1, 30).map((r) => r.Id));
  });
});
