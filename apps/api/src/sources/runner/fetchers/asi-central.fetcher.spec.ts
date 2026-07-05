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
    { baseUrl: BASE, searchQuery: 'null', retryBackoffMs: 1 },
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
});
