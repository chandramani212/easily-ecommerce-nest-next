# Supplier Module Pagination — Design Spec

Date: 2026-05-09

## Overview

Add server-side pagination to all table views in the supplier module using the existing `Pager` component pattern (same as orders, customers, contacts). Page size is 20 throughout.

## Scope

Three places get paginated. The Activity tab is explicitly out of scope.

### 1. Suppliers List (`/suppliers`)

**API change:** `suppliers.service.ts` `list()` currently returns all suppliers with no limit. Add `take`/`skip` support and return `{ items, total }` instead of a plain array.

**DTO change:** Add a `SupplierListPaginationQuery` (or extend `SupplierListQuery`) with optional `@IsInt() take` and `skip` fields, consistent with `RunsListQuery`.

**UI change:** `apps/admin/app/(admin)/suppliers/page.tsx` reads `page` from search params, computes `skip = (page - 1) * 20`, calls API with `take=20&skip=N`, renders `<Pager>` below `<DataTable>`.

### 2. Products Tab (`/suppliers/[id]?tab=products`)

**API:** Already supports `take`/`skip` and returns `{ items, total }` — no changes needed.

**UI change:** `[id]/page.tsx` reads a `productsPage` search param (separate name avoids clash with other tabs sharing the same URL). Computes `skip`, passes it to the `/suppliers/${id}/products` fetch with `take=20`. `SupplierProducts` component receives `total` and renders `<Pager productsPage param>`.

`Pager` uses `?productsPage=N` instead of `?page=N` so switching tabs doesn't reset the other tab's page.

### 3. Import Runs Page (`/suppliers/[id]/imports/[importId]/runs`)

**API:** Already supports `take`/`skip` and returns `{ items, total }` — no changes needed.

**UI change:** `runs/page.tsx` reads `page` from search params, computes `skip = (page - 1) * 20`, calls API with `take=20&skip=N`, passes `total` and current `page` down, renders `<Pager>` below `<RunsTable>`.

## Pager Integration Pattern

Follows existing orders-page pattern exactly:

```
const page = Number(p(sp, "page") ?? "1");
const pageSize = 20;
const skip = (page - 1) * pageSize;
const data = await apiFetch<{ items: T[]; total: number }>(`...?take=${pageSize}&skip=${skip}`);
const pageCount = Math.ceil(data.total / pageSize);
// render <Pager page={page} pageCount={pageCount} total={data.total} />
```

For the products tab, substitute `productsPage` for `page` everywhere. The `Pager` component reads/writes search params via `useSearchParams`, so the param name must match what the server reads.

**Note:** `Pager` uses `router.push` with the current `searchParams`, so it preserves other params (e.g., `tab=products`) when navigating pages — this works correctly for the products tab case.

## API Response Shape

- Suppliers list: change from `Supplier[]` to `{ items: Supplier[]; total: number; page: number; pageCount: number }` — matching the `Pagination<T>` type already used by orders.
- Products and Runs: already return `{ items, total }`. Compute `page`/`pageCount` on the client from URL params and `total`.

## Files Changed

**API (`apps/api`):**
- `suppliers/dto/supplier.dto.ts` — add pagination fields to `SupplierListQuery`
- `suppliers/suppliers.service.ts` — update `list()` to paginate
- `suppliers/suppliers.controller.ts` — pass query through to `list()`

**Admin (`apps/admin`):**
- `app/(admin)/suppliers/page.tsx` — read page param, render `<Pager>`
- `app/(admin)/suppliers/[id]/page.tsx` — read `productsPage` param, pass skip to products fetch
- `app/(admin)/suppliers/[id]/supplier-products.tsx` — accept `total`/`page`/`pageCount`, render `<Pager>`
- `app/(admin)/suppliers/[id]/imports/[importId]/runs/page.tsx` — read page param, pass skip, render `<Pager>`

## Out of Scope

- Activity tab pagination
- Imports tab pagination (suppliers have few imports per supplier)
- Any new UI components (reuse existing `Pager`)
