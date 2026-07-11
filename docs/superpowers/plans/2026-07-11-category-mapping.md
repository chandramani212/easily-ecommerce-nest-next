# Category Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a curated 3-level storefront category tree, map the 1,118 ASI source categories into its leaf nodes, and backfill the ~110,890 already-imported products so they appear under their categories.

**Architecture:** A checked-in, reviewable mapping file (`curatedTree` + `sourceMap`) plus an idempotent script that (1) validates, (2) creates only the curated categories that are used (+ `Bestsellers`), (3) sets `SourceCategory.categoryId`, and (4) backfills products by asking the ASI search API which products belong to each mapped source category. Pure logic lives in a tested util module; the fetcher gains one public method to list a category's product ids without detail fetches.

**Tech Stack:** NestJS 11, Prisma 6 / PostgreSQL "shopease", TypeScript 5.9, Jest 29 + ts-jest, undici `fetch`. Scripts run via `ts-node`.

## Global Constraints

- **Do not change existing `apps/api` HTTP routes** — add new siblings only (admin depends on current URLs). This plan adds no controllers; DB + script + one fetcher method only.
- **Jest `rootDir` is `src`, `testRegex` `.*\.spec\.ts$`** — every `*.spec.ts` MUST live under `apps/api/src/`.
- **Storefront renders products only on LEAF categories** (a category with children shows subcategory tiles; a leaf filters products by exact `categoryId`). Every `sourceMap` target MUST be a leaf; products connect to leaves only.
- **Curated `Category.slug` is `@unique`** — upserts key on `slug`.
- **ASI hard limits:** search caps at 1000 results/query, `rpp` clamped to 100. Categories with >1000 products need price bisection (reuse `partitionByPrice` seeded with a category selection).
- **`SourceCategory` unique key is `@@unique([sourceId, externalId])`**; `SourceProductLink` unique key is `@@unique([sourceId, externalId])` where `externalId` is the ASI product id.
- All commands run from `apps/api/` unless stated. The API is compiled/not auto-supervised; these tasks need no running API.

---

## File Structure

**Create:**
- `apps/api/src/sources/category-map/category-map.types.ts` — `CuratedNode`, `SourceMap` types.
- `apps/api/src/sources/category-map/category-map.data.ts` — `curatedTree`, `sourceMap`, `ALWAYS_CREATE` (the reviewable artifact).
- `apps/api/src/sources/category-map/category-map.util.ts` — pure functions (flatten, validate, prune, match).
- `apps/api/src/sources/category-map/category-map.util.spec.ts` — unit tests for the util.
- `apps/api/src/sources/category-map/apply-category-map.ts` — the runnable idempotent script.

**Modify:**
- `apps/api/src/sources/runner/fetchers/asi-central.fetcher.ts` — add public `collectCategoryProductIds(categoryValue)`.
- `apps/api/src/sources/runner/fetchers/asi-central.fetcher.spec.ts` — test the new method.
- `apps/api/package.json` — add `apply:category-map` script.

---

## Task 1: Spike — confirm the ASI category search token

**Why:** The backfill filters ASI search by `q=category:<token>`. We stored `SourceCategory.externalId` (ASI's category code), which may or may not equal the facet `ContextPath` that search expects. Confirm the working token before building on it. No production code changes; this task records a decision used by Tasks 2 and 6.

**Files:** none (probe script in scratchpad).

- [ ] **Step 1: Pick a known mid-size source category**

Run (from `apps/api/`):

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  const rows=await p.sourceCategory.findMany({where:{parentExternalId:null},take:5,select:{externalId:true,name:true}});
  console.log(rows);
  await p.\$disconnect();
})();
"
```

Expected: a few top-level source cats with `externalId` + `name` (e.g. `{ externalId: 'P02930003', name: 'Pens' }`).

- [ ] **Step 2: Decrypt ASI creds and probe both token forms**

Write `/tmp/claude-1000/-var-www-html-ecommerce/1950c570-9ad2-4bf6-9d84-d65ccf106edd/scratchpad/probe-cat.mjs` that: loads the ASI `Source` (kind `ASI_CENTRAL`) via Prisma, decrypts `authSecret` with the SecretsCipher format (`v1:iv:tag:ct`, key = base64(`SECRETS_ENCRYPTION_KEY`) if 32 bytes else sha256(`JWT_SECRET`)), then issues three `GET {baseUrl}/products/search.json?page=1&rpp=1&q=<Q>` requests with header `Authorization: AsiMemberAuth client_id=<id>&client_secret=<secret>` for:
  - `Q = category:<externalId>` (e.g. `category:P02930003`)
  - `Q = category:<Name>` (e.g. `category:Pens`)
  - a `dl=category_all` facet call to read the bucket's `ContextPath` for that name, then `Q = category:<ContextPath>`

Log each response's `ResultsTotal` and `Breadcrumb`/`Selections`.

Run: `node .../scratchpad/probe-cat.mjs`
Expected: exactly one of the token forms returns a non-zero `ResultsTotal` with a `Breadcrumb` confirming the category filter (e.g. "Category is Pens"). That form is the **confirmed token**.

- [ ] **Step 3: Record the decision in the plan**

Edit this file's Task 6 note to state the confirmed token form: `externalId`, `name`, or `ContextPath (resolved via dl=category_all)`. If `ContextPath` is required, Task 2 additionally exposes `fetchCategoryFacets()` (see Task 2, optional step).

Expected: Task 6 backfill has an unambiguous token source. No commit (spike only).

---

## Task 2: Fetcher — list a category's product ids without detail fetches

**Files:**
- Modify: `apps/api/src/sources/runner/fetchers/asi-central.fetcher.ts`
- Test: `apps/api/src/sources/runner/fetchers/asi-central.fetcher.spec.ts`

**Interfaces:**
- Consumes: existing private `partitionByPrice(lo, hi, selections, baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered, onIds?)`, config defaults (`maxPages ?? 5000`, `maxRecords ?? 200000`, `timeoutMs ?? 60000`, `retryBackoffMs ?? 500`), constant `MAX_PRICE`.
- Produces: `AsiCentralFetcher.collectCategoryProductIds(categoryValue: string): Promise<string[]>` — ids only, no detail/`onBatch` calls, complete past the 1000-cap via price bisection under the category selection.

- [ ] **Step 1: Write the failing test**

Add to `asi-central.fetcher.spec.ts` (follow the existing mock-`fetch` style already used by "price-partitions the full catalog past the 1000-cap"). Model 1500 products priced 1..N in category `PENS`; the mock honours `category:PENS` and `price:[lo to hi]` in `q`, clamps any single walk to 1000 rows, and returns ids as `{ Id: <n> }`:

```ts
it('lists all product ids in a category past the 1000-cap, no detail fetch', async () => {
  const TOTAL = 1500;
  const inCat = Array.from({ length: TOTAL }, (_, i) => ({ id: i + 1, price: i + 1 }));
  let detailCalls = 0;
  const mock = makeAsiMock({
    onDetail: () => { detailCalls++; },
    search: (q: string) => {
      if (!/category:PENS/.test(q)) return [];
      const m = q.match(/price:\[(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)\]/);
      let rows = inCat;
      if (m) { const lo = +m[1], hi = +m[2]; rows = inCat.filter(p => p.price >= lo && p.price <= hi); }
      return rows.slice(0, 1000).map(p => ({ Id: p.id }));
    },
  });
  const fetcher = new AsiCentralFetcher({ baseUrl: 'https://asi.test/v1', transientRetryBaseMs: 1 }, stubAuth());
  (globalThis as any).fetch = mock;

  const ids = await fetcher.collectCategoryProductIds('PENS');

  expect(new Set(ids).size).toBe(TOTAL);      // complete, deduped
  expect(detailCalls).toBe(0);                 // ids only, no detail phase
});
```

> Reuse the suite's existing `makeAsiMock`/`stubAuth` helpers; if the helper names differ, match the existing test file's helpers (the "price-partitions… past the 1000-cap" test already builds an equivalent mock — copy its shape).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/sources/runner/fetchers/asi-central.fetcher.spec.ts -t "lists all product ids in a category" -c ../../jest.config.ts`
(If the repo-root jest picks it up more simply, run `npm test -- -t "lists all product ids in a category"` from `apps/api/`.)
Expected: FAIL — `collectCategoryProductIds is not a function`.

- [ ] **Step 3: Implement the method**

Add as a public method on `AsiCentralFetcher` (near `fetch()`):

```ts
/**
 * Collect every ASI product id in one category, ids only (no detail fetches).
 * Seeds the price-bisection collector with a `category:<value>` selection so
 * categories over ASI's 1000-result cap are fully covered. Used by the
 * category-backfill script; the normal import path uses `fetch()`.
 */
async collectCategoryProductIds(categoryValue: string): Promise<string[]> {
  const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const maxPages = this.cfg.maxPages ?? 5000;
  const maxRecords = this.cfg.maxRecords ?? 200_000;
  const timeoutMs = this.cfg.timeoutMs ?? 60_000;
  const backoffMs = this.cfg.retryBackoffMs ?? 500;
  const seen = new Set<string>();
  const ordered: string[] = [];
  await this.partitionByPrice(
    0, MAX_PRICE,
    [{ dim: 'category', value: categoryValue }],
    baseUrl, maxPages, maxRecords, timeoutMs, backoffMs, seen, ordered,
  );
  this.logger.log(
    `ASI collectCategoryProductIds(${categoryValue}): ${ordered.length} ids`,
  );
  return ordered;
}
```

- [ ] **Step 4 (optional — only if Task 1 confirmed `ContextPath`): expose facets**

If Task 1 found the token must be `ContextPath`, also add:

```ts
/** Category facet buckets (Name + ContextPath) via `dl=category_all`. */
async fetchCategoryFacets(): Promise<{ name: string; contextPath: string }[]> {
  const baseUrl = (this.cfg.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const timeoutMs = this.cfg.timeoutMs ?? 60_000;
  const buckets = await this.getBuckets(baseUrl, [], 'category', timeoutMs);
  return buckets.map(b => ({ name: b.Name ?? '', contextPath: b.value }));
}
```

(Match the exact shape `getBuckets` returns — it already normalizes `ContextPath` into a `value` field; if not, read `ContextPath` directly.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- -t "lists all product ids in a category"` (from `apps/api/`)
Expected: PASS.

- [ ] **Step 6: Full fetcher suite still green**

Run: `npm test -- src/sources/runner/fetchers/asi-central.fetcher.spec.ts`
Expected: all fetcher tests PASS (the prior 10 + new one).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/sources/runner/fetchers/asi-central.fetcher.ts apps/api/src/sources/runner/fetchers/asi-central.fetcher.spec.ts
git commit -m "feat(asi): collectCategoryProductIds for category-scoped id listing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Mapping types + data scaffold

**Files:**
- Create: `apps/api/src/sources/category-map/category-map.types.ts`
- Create: `apps/api/src/sources/category-map/category-map.data.ts`

**Interfaces:**
- Produces:
  - `interface CuratedNode { slug: string; name: string; sortOrder?: number; children?: CuratedNode[]; }`
  - `type SourceMap = Record<string, string>` — ASI `externalId` → curated **leaf** `slug`.
  - `const curatedTree: CuratedNode[]`, `const sourceMap: SourceMap`, `const ALWAYS_CREATE: string[]`.

- [ ] **Step 1: Write the types file**

`category-map.types.ts`:

```ts
/** One node in the curated storefront taxonomy. "3-level" is the max depth;
 *  a branch may stop shallower. Nodes with no `children` are leaves — the only
 *  categories the storefront renders products on. */
export interface CuratedNode {
  slug: string;        // unique storefront slug (kebab-case)
  name: string;        // display name
  sortOrder?: number;  // display order among siblings; defaults to array index
  children?: CuratedNode[];
}

/** ASI SourceCategory.externalId → curated LEAF slug. Omitted id = skipped. */
export type SourceMap = Record<string, string>;
```

- [ ] **Step 2: Write the data scaffold**

`category-map.data.ts` — a small, valid starter that Task 5's tests and the full-generation task (Task 3b) build on. Real content is authored in Task 3b.

```ts
import type { CuratedNode, SourceMap } from './category-map.types';

/** Curated slugs to create even with no source-cat mapping (empty leaves). */
export const ALWAYS_CREATE: string[] = ['bestsellers'];

/** The curated 3-level tree. Expanded in Task 3b from competitor-site structure. */
export const curatedTree: CuratedNode[] = [
  { slug: 'bestsellers', name: 'Bestsellers', sortOrder: 0 }, // top-level empty leaf
  {
    slug: 'apparel', name: 'Apparel', sortOrder: 1, children: [
      { slug: 't-shirts', name: 'T-Shirts', children: [
        { slug: 't-shirts-mens', name: "Men's" },
        { slug: 't-shirts-unisex', name: 'Unisex' },
      ] },
      { slug: 'polos', name: 'Polos' },
    ],
  },
  {
    slug: 'drinkware', name: 'Drinkware', sortOrder: 2, children: [
      { slug: 'bottles', name: 'Bottles', children: [
        { slug: 'bottles-insulated', name: 'Insulated' },
      ] },
    ],
  },
];

/** ASI externalId → curated leaf slug. Expanded in Task 3b (all 1,118 rows). */
export const sourceMap: SourceMap = {
  T00250003: 't-shirts',        // "T-shirts"
  T00252003: 't-shirts-mens',   // "T-shirts › Mens"
  T00253003: 't-shirts-unisex', // "T-shirts › Unisex"
  G06035003: 'polos',           // "Golf/polo Shirts"
  B06810003: 'bottles',         // "Bottles"
  B06812003: 'bottles-insulated', // "Bottles › Insulated"
  // ... remaining rows added in Task 3b; unmapped ids are simply omitted.
};
```

- [ ] **Step 3: Type-check compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from the new files.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/sources/category-map/category-map.types.ts apps/api/src/sources/category-map/category-map.data.ts
git commit -m "feat(category-map): types + starter curated tree/sourceMap

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3b: Generate the full source→curated mapping (data authoring)

**Why a separate task:** this is content, not logic — a fresh reviewer approves/edits the mapping without touching code. Produces the final `curatedTree` + `sourceMap` covering all 1,118 source cats.

**Files:**
- Modify: `apps/api/src/sources/category-map/category-map.data.ts`

- [ ] **Step 1: Harvest competitor taxonomies**

WebFetch the category/nav (or sitemap) of:
- `https://www.everythingpromo.com`
- `https://brandedpromo.com`
- `https://www.printed4you.co.uk`

Extract each site's L1/L2 menu. Merge into a proposed L1/L2 skeleton with naming. Save the raw harvest to the scratchpad for reference.

- [ ] **Step 2: Dump all source categories with hierarchy**

Run (from `apps/api/`), writing to scratchpad:

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  const rows=await p.sourceCategory.findMany({select:{externalId:true,name:true,parentExternalId:true},orderBy:{name:'asc'}});
  const byId=Object.fromEntries(rows.map(r=>[r.externalId,r]));
  const line=r=>{const par=r.parentExternalId&&byId[r.parentExternalId];return (par?par.name+' › ':'')+r.name+'\t'+r.externalId;};
  require('fs').writeFileSync(process.env.SCRATCH+'/source-cats.tsv', rows.map(line).join('\n'));
  console.log('wrote',rows.length,'rows');
  await p.\$disconnect();
})();
" SCRATCH=/tmp/claude-1000/-var-www-html-ecommerce/1950c570-9ad2-4bf6-9d84-d65ccf106edd/scratchpad
```

Expected: `wrote 1118 rows` and a TSV of `Parent › Name  externalId`.

- [ ] **Step 3: Author the mapping**

Using the competitor skeleton (L1/L2) and the source-cat hierarchy (which supplies L3 detail), assign every source cat to a curated **leaf** slug, or omit it (skip). Rules:
- Cluster synonyms/near-duplicates onto shared leaves.
- Use `Parent › Name` to disambiguate collisions (e.g. "Unisex" under different parents → different leaves).
- Every `sourceMap` value must be a leaf slug present in `curatedTree`.
- Keep `Bestsellers` in `curatedTree`/`ALWAYS_CREATE` with no mappings.

Replace `curatedTree` and `sourceMap` in `category-map.data.ts` with the full content. Each `sourceMap` line keeps a `// "Parent › Name"` comment for review.

- [ ] **Step 4: Validate compiles + no obvious gaps**

Run: `npx tsc --noEmit -p tsconfig.json`
Then a quick coverage print (mapped vs skipped counts):

```bash
npx ts-node -e "import('./src/sources/category-map/category-map.data').then(m=>console.log({mapped:Object.keys(m.sourceMap).length}))"
```

Expected: compiles; mapped count is a sensible fraction of 1,118 (skips are expected).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/sources/category-map/category-map.data.ts
git commit -m "feat(category-map): full source→curated mapping (all 1118 source cats)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 6: USER REVIEW GATE** — pause and ask the user to review `category-map.data.ts` (this is the artifact only they can sign off). Apply edits they request before Task 5 runs against real data.

---

## Task 4: Pure util — flatten, validate, prune, match

**Files:**
- Create: `apps/api/src/sources/category-map/category-map.util.ts`
- Test: `apps/api/src/sources/category-map/category-map.util.spec.ts`

**Interfaces:**
- Consumes: `CuratedNode`, `SourceMap` from `./category-map.types`.
- Produces:
  - `interface FlatNode { slug: string; name: string; sortOrder: number; parentSlug: string | null; isLeaf: boolean; }`
  - `flattenTree(tree: CuratedNode[]): FlatNode[]` — parents before children (creation order).
  - `leafSlugs(tree: CuratedNode[]): Set<string>`
  - `validateSourceMap(tree: CuratedNode[], sourceMap: SourceMap): string[]` — human-readable errors; empty = valid. Errors when a target slug is missing OR not a leaf.
  - `usedSlugsToCreate(tree: CuratedNode[], sourceMap: SourceMap, alwaysCreate: string[]): Set<string>` — used leaves + all ancestors + alwaysCreate (+ their ancestors).
  - `matchProductIds(asiIds: string[], linkByExternalId: Map<string, string>): string[]` — productIds for ids present in the link map (deduped).

- [ ] **Step 1: Write the failing tests**

`category-map.util.spec.ts`:

```ts
import { CuratedNode, SourceMap } from './category-map.types';
import {
  flattenTree, leafSlugs, validateSourceMap, usedSlugsToCreate, matchProductIds,
} from './category-map.util';

const tree: CuratedNode[] = [
  { slug: 'bestsellers', name: 'Bestsellers' },
  { slug: 'apparel', name: 'Apparel', children: [
    { slug: 't-shirts', name: 'T-Shirts', children: [
      { slug: 't-shirts-mens', name: "Men's" },
    ] },
    { slug: 'polos', name: 'Polos' },
  ] },
];

it('flattens parents before children', () => {
  const flat = flattenTree(tree).map(n => n.slug);
  expect(flat.indexOf('apparel')).toBeLessThan(flat.indexOf('t-shirts'));
  expect(flat.indexOf('t-shirts')).toBeLessThan(flat.indexOf('t-shirts-mens'));
  const mens = flattenTree(tree).find(n => n.slug === 't-shirts-mens')!;
  expect(mens.parentSlug).toBe('t-shirts');
  expect(mens.isLeaf).toBe(true);
});

it('identifies leaves', () => {
  expect(leafSlugs(tree)).toEqual(new Set(['bestsellers', 't-shirts-mens', 'polos']));
});

it('rejects mapping to a non-leaf or missing slug', () => {
  const bad: SourceMap = { A: 'apparel' /* parent */, B: 'nope' /* missing */, C: 'polos' /* ok */ };
  const errs = validateSourceMap(tree, bad);
  expect(errs.some(e => e.includes('apparel'))).toBe(true);   // not a leaf
  expect(errs.some(e => e.includes('nope'))).toBe(true);      // missing
  expect(errs.some(e => e.includes('polos'))).toBe(false);    // fine
});

it('creates used leaves + ancestors + alwaysCreate only', () => {
  const map: SourceMap = { A: 't-shirts-mens' };
  const used = usedSlugsToCreate(tree, map, ['bestsellers']);
  expect(used).toEqual(new Set(['t-shirts-mens', 't-shirts', 'apparel', 'bestsellers']));
  expect(used.has('polos')).toBe(false); // unused, pruned
});

it('matches asi ids to product ids, deduped', () => {
  const link = new Map([['a1', 'pA'], ['a2', 'pB']]);
  expect(matchProductIds(['a1', 'a2', 'a1', 'a9'], link)).toEqual(['pA', 'pB']);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/sources/category-map/category-map.util.spec.ts`
Expected: FAIL — module `./category-map.util` not found.

- [ ] **Step 3: Implement the util**

`category-map.util.ts`:

```ts
import { CuratedNode, SourceMap } from './category-map.types';

export interface FlatNode {
  slug: string;
  name: string;
  sortOrder: number;
  parentSlug: string | null;
  isLeaf: boolean;
}

export function flattenTree(tree: CuratedNode[]): FlatNode[] {
  const out: FlatNode[] = [];
  const walk = (nodes: CuratedNode[], parent: string | null) => {
    nodes.forEach((n, i) => {
      out.push({
        slug: n.slug,
        name: n.name,
        sortOrder: n.sortOrder ?? i,
        parentSlug: parent,
        isLeaf: !n.children || n.children.length === 0,
      });
      if (n.children?.length) walk(n.children, n.slug);
    });
  };
  walk(tree, null);
  return out;
}

export function leafSlugs(tree: CuratedNode[]): Set<string> {
  return new Set(flattenTree(tree).filter(n => n.isLeaf).map(n => n.slug));
}

export function validateSourceMap(tree: CuratedNode[], sourceMap: SourceMap): string[] {
  const flat = flattenTree(tree);
  const bySlug = new Map(flat.map(n => [n.slug, n]));
  const errs: string[] = [];
  for (const [externalId, slug] of Object.entries(sourceMap)) {
    const node = bySlug.get(slug);
    if (!node) errs.push(`sourceMap[${externalId}] -> "${slug}" missing from curatedTree`);
    else if (!node.isLeaf) errs.push(`sourceMap[${externalId}] -> "${slug}" is not a leaf (has children)`);
  }
  return errs;
}

export function usedSlugsToCreate(
  tree: CuratedNode[], sourceMap: SourceMap, alwaysCreate: string[],
): Set<string> {
  const flat = flattenTree(tree);
  const parentOf = new Map(flat.map(n => [n.slug, n.parentSlug]));
  const out = new Set<string>();
  const addWithAncestors = (slug: string) => {
    let cur: string | null | undefined = slug;
    while (cur && !out.has(cur)) {
      out.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
  };
  for (const slug of Object.values(sourceMap)) addWithAncestors(slug);
  for (const slug of alwaysCreate) if (parentOf.has(slug)) addWithAncestors(slug);
  return out;
}

export function matchProductIds(
  asiIds: string[], linkByExternalId: Map<string, string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of asiIds) {
    const pid = linkByExternalId.get(id);
    if (pid && !seen.has(pid)) { seen.add(pid); out.push(pid); }
  }
  return out;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/sources/category-map/category-map.util.spec.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/sources/category-map/category-map.util.ts apps/api/src/sources/category-map/category-map.util.spec.ts
git commit -m "feat(category-map): pure util (flatten/validate/prune/match) + tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Apply script — phases 1–3 (validate, create categories, set mappings)

**Files:**
- Create: `apps/api/src/sources/category-map/apply-category-map.ts`
- Modify: `apps/api/package.json` (add script)

**Interfaces:**
- Consumes: `curatedTree`, `sourceMap`, `ALWAYS_CREATE` (data); `flattenTree`, `validateSourceMap`, `usedSlugsToCreate` (util); `PrismaService`, `SecretsCipher`, `AppModule`, `buildAuthAdapter`, `AsiCentralFetcher`.
- Produces: a runnable script exposing `async function main()`; phase 4 added in Task 6. Reads env: `BACKFILL=1` gates phase 4 (default off so phases 1–3 can be run/verified alone).

- [ ] **Step 1: Write the script (phases 1–3 + phase-4 stub)**

`apply-category-map.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { SecretsCipher } from '../runner/encryption.util';
import { buildAuthAdapter } from '../runner/auth';
import { AsiCentralFetcher } from '../runner/fetchers/asi-central.fetcher';
import { curatedTree, sourceMap, ALWAYS_CREATE } from './category-map.data';
import {
  flattenTree, validateSourceMap, usedSlugsToCreate,
} from './category-map.util';

const log = new Logger('apply-category-map');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const prisma = app.get(PrismaService);

  // ---- Phase 1: validate ------------------------------------------------
  const errs = validateSourceMap(curatedTree, sourceMap);
  if (errs.length) {
    log.error(`Validation failed (${errs.length}):`);
    errs.slice(0, 50).forEach(e => log.error('  ' + e));
    await app.close();
    process.exit(1);
  }
  log.log('Validation OK.');

  const source = await prisma.source.findFirst({ where: { kind: 'ASI_CENTRAL' } });
  if (!source) { log.error('No ASI_CENTRAL source found.'); await app.close(); process.exit(1); }

  // ---- Phase 2: create curated categories (prune + alwaysCreate) --------
  const create = usedSlugsToCreate(curatedTree, sourceMap, ALWAYS_CREATE);
  const flat = flattenTree(curatedTree).filter(n => create.has(n.slug)); // parents first
  const idBySlug = new Map<string, string>();
  for (const n of flat) {
    const parentId = n.parentSlug ? idBySlug.get(n.parentSlug) ?? null : null;
    const cat = await prisma.category.upsert({
      where: { slug: n.slug },
      create: { slug: n.slug, name: n.name, sortOrder: n.sortOrder, parentId, active: true },
      update: { name: n.name, sortOrder: n.sortOrder, parentId },
    });
    idBySlug.set(n.slug, cat.id);
  }
  log.log(`Upserted ${idBySlug.size} curated categories.`);

  // ---- Phase 3: set SourceCategory.categoryId ---------------------------
  let mapped = 0, missing = 0;
  for (const [externalId, slug] of Object.entries(sourceMap)) {
    const categoryId = idBySlug.get(slug);
    if (!categoryId) continue;
    const res = await prisma.sourceCategory.updateMany({
      where: { sourceId: source.id, externalId },
      data: { categoryId },
    });
    if (res.count) mapped += res.count; else missing++;
  }
  log.log(`Set categoryId on ${mapped} source categories (${missing} externalIds not in DB).`);

  // ---- Phase 4: backfill products (Task 6) ------------------------------
  if (process.env.BACKFILL === '1') {
    const cipher = app.get(SecretsCipher);
    await backfill(prisma, source, cipher); // defined in Task 6
  } else {
    log.log('Skipping backfill (set BACKFILL=1 to run it).');
  }

  await app.close();
  log.log('Done.');
}

main().catch(e => { log.error(e); process.exit(1); });
```

> Verify the import paths (`../../prisma/prisma.service`, `../runner/encryption.util`, `../runner/auth`) against the actual files — adjust to match how other modules import `PrismaService`/`SecretsCipher`.

- [ ] **Step 2: Add npm script**

In `apps/api/package.json` `scripts`, add:

```json
"apply:category-map": "ts-node -r tsconfig-paths/register src/sources/category-map/apply-category-map.ts"
```

- [ ] **Step 3: Run phases 1–3 against the DB**

Run (from `apps/api/`): `BACKFILL=0 npm run apply:category-map`
Expected: `Validation OK.`, `Upserted N curated categories.`, `Set categoryId on M source categories …`, `Skipping backfill …`, `Done.` No exceptions.

- [ ] **Step 4: Verify in DB**

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  console.log({cats:await p.category.count(),
    mappedSC:await p.sourceCategory.count({where:{categoryId:{not:null}}}),
    bestsellers:await p.category.findUnique({where:{slug:'bestsellers'}}).then(c=>!!c)});
  await p.\$disconnect();
})();
"
```

Expected: `cats` = size of the used set, `mappedSC` > 0, `bestsellers: true`.

- [ ] **Step 5: Idempotency check**

Re-run: `BACKFILL=0 npm run apply:category-map`
Then re-run Step 4's count query.
Expected: identical `cats` count (no duplicates — upsert by slug), same `mappedSC`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/sources/category-map/apply-category-map.ts apps/api/package.json
git commit -m "feat(category-map): apply script phases 1-3 (validate/create/map)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Apply script — phase 4 (search-driven product backfill)

**Files:**
- Modify: `apps/api/src/sources/category-map/apply-category-map.ts`

**Interfaces:**
- Consumes: `AsiCentralFetcher.collectCategoryProductIds` (Task 2); `matchProductIds` (Task 4); `buildAuthAdapter`, `SecretsCipher`; confirmed category token from Task 1.
- Produces: `async function backfill(prisma, source, cipher): Promise<void>` — connects each mapped source cat's products to its leaf `Category`, idempotently.

- [ ] **Step 1: Build the fetcher inside the script**

Add near the top of `main`'s module (helper), mirroring `buildFetcher`'s ASI branch:

```ts
function buildAsiFetcher(source: { baseUrl: string | null; authType: any; authSecret: string | null }, cipher: SecretsCipher) {
  const creds = source.authSecret ? cipher.tryDecryptJson(source.authSecret) : null;
  const auth = buildAuthAdapter(source.authType, creds ?? {});
  return new AsiCentralFetcher({ baseUrl: source.baseUrl }, auth);
}
```

- [ ] **Step 2: Implement `backfill`**

Uses the **confirmed token from Task 1**. Shown here for `token = externalId`; if Task 1 confirmed `ContextPath`, first build a `externalId→ContextPath` map from `fetcher.fetchCategoryFacets()` matched by source-cat name, and pass that instead of `externalId`.

```ts
async function backfill(prisma: PrismaService, source: any, cipher: SecretsCipher) {
  const fetcher = buildAsiFetcher(source, cipher);

  // Only source cats that got a categoryId in phase 3.
  const mappedCats = await prisma.sourceCategory.findMany({
    where: { sourceId: source.id, categoryId: { not: null } },
    select: { externalId: true, name: true, categoryId: true },
  });

  // externalId(ASI product id) -> productId, for match lookups.
  const links = await prisma.sourceProductLink.findMany({
    where: { sourceId: source.id }, select: { externalId: true, productId: true },
  });
  const linkByExternalId = new Map(links.map(l => [l.externalId, l.productId]));
  log.log(`Backfill: ${mappedCats.length} categories, ${linkByExternalId.size} product links.`);

  let connected = 0, i = 0;
  for (const sc of mappedCats) {
    i++;
    let asiIds: string[] = [];
    try {
      asiIds = await fetcher.collectCategoryProductIds(sc.externalId); // token per Task 1
    } catch (e) {
      log.warn(`  [${i}/${mappedCats.length}] ${sc.name}: collect failed — ${(e as Error).message}`);
      continue;
    }
    const productIds = matchProductIds(asiIds, linkByExternalId);
    // Connect in chunks so a single query isn't unbounded. connect is idempotent.
    for (let j = 0; j < productIds.length; j += 500) {
      const chunk = productIds.slice(j, j + 500);
      await prisma.category.update({
        where: { id: sc.categoryId! },
        data: { products: { connect: chunk.map(id => ({ id })) } },
      });
    }
    connected += productIds.length;
    if (i % 25 === 0 || i === mappedCats.length) {
      log.log(`  [${i}/${mappedCats.length}] ${sc.name}: +${productIds.length} (running ${connected})`);
    }
  }
  log.log(`Backfill complete: ${connected} product-category connections.`);
}
```

> `connect` is additive and idempotent — re-connecting an existing member is a no-op, so a product in multiple mapped cats lands in multiple leaves and a re-run is safe.

- [ ] **Step 3: Dry-run on ONE category first**

Temporarily cap the loop (`mappedCats.slice(0, 1)`) or add `LIMIT=1` env handling, then run:
`BACKFILL=1 LIMIT=1 npm run apply:category-map`
Expected: the one category logs `+N` with N > 0, no errors. Then verify:

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{console.log({withCat:await p.product.count({where:{categories:{some:{}}}})});await p.\$disconnect();})();
"
```

Expected: `withCat` jumped from 0 to N. Remove the temporary cap.

- [ ] **Step 4: Full backfill**

Run: `BACKFILL=1 npm run apply:category-map`
Expected: progress logs per 25 cats; ends `Backfill complete: <big number> connections.` (This is rate-limited and can take a while — that's expected.)

- [ ] **Step 5: Verify coverage + idempotency**

```bash
node -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
  console.log({withCat:await p.product.count({where:{categories:{some:{}}}}),
    bestsellersProducts:await p.product.count({where:{categories:{some:{slug:'bestsellers'}}}})});
  await p.\$disconnect();
})();
"
```

Expected: `withCat` is a large fraction of 110,890; `bestsellersProducts` = 0 (empty by design). Re-running the full backfill does not increase connection counts beyond real membership (idempotent).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/sources/category-map/apply-category-map.ts
git commit -m "feat(category-map): phase 4 search-driven product backfill

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: End-to-end verification + housekeeping

**Files:** none (verification + docs).

- [ ] **Step 1: Full test suite**

Run (from `apps/api/`): `npm test`
Expected: all suites PASS (fetcher + util + prior suite).

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json` then `npm run build`
Expected: clean.

- [ ] **Step 3: Verify storefront rendering path**

Confirm a leaf category page lists products and a parent shows subcategory tiles. With web (`:3000`) running, open a mapped leaf (e.g. `/t-shirts-mens`) and its parent (`/apparel`). Alternatively hit the API directly:

```bash
# pick a leaf category id that has products, then:
curl -s "http://localhost:3001/products?active=true&pageSize=5&categoryId=<LEAF_ID>" | head -c 400
```

Expected: leaf returns products; parent (`/apparel`) has children so the web renders tiles (per `apps/web/app/[slug]/page.tsx`).

- [ ] **Step 4: Update the knowledge graph**

Run (from repo root `/var/www/html/ecommerce`): `graphify update .`
Expected: graph updated (AST-only, no API cost).

- [ ] **Step 5: Update memory**

Append a memory file `project_category_mapping.md` (type: project) capturing: curated tree lives in `apps/api/src/sources/category-map/category-map.data.ts`; mapping keyed by ASI externalId → leaf slug; products render only on leaf categories; backfill is search-driven via `collectCategoryProductIds`; `Bestsellers` is an always-create empty leaf filled manually. Add its one-line pointer to `MEMORY.md`. Link `[[project_asi_pagination_cap]]`.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore(category-map): update graph + memory after mapping rollout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Competitor harvest → Task 3b Step 1. ✅
- Curated 3-level tree + `sourceMap` (leaf-only) → Tasks 3, 3b; leaf rule enforced by `validateSourceMap` (Task 4). ✅
- Hybrid prune + `alwaysCreate`/Bestsellers → `usedSlugsToCreate` (Task 4), phase 2 (Task 5). ✅
- Set `SourceCategory.categoryId` → phase 3 (Task 5). ✅
- Search-driven backfill of 110,890 products, >1000-cap safe → `collectCategoryProductIds` (Task 2) + phase 4 (Task 6). ✅
- Category-token risk → Task 1 spike, consumed by Tasks 2/6. ✅
- Future imports auto-categorize → no code needed (existing `resolveCategoryIds`); noted, verified indirectly by phase 3. ✅
- Idempotency → Task 5 Step 5, Task 6 Step 5. ✅
- Tests under `src/` (jest rootDir) → Tasks 2, 4. ✅

**Placeholder scan:** no "TBD/TODO/handle appropriately"; the only deferred content is Task 3b's authored data (its own task with a procedure) and the Task 1-dependent token (explicit branch in Tasks 2/6). ✅

**Type consistency:** `CuratedNode`/`SourceMap` defined in Task 3 and used unchanged in Tasks 4–6; util names (`flattenTree`, `validateSourceMap`, `usedSlugsToCreate`, `matchProductIds`) consistent across Tasks 4–6; fetcher method name `collectCategoryProductIds` consistent in Tasks 2 and 6. ✅
