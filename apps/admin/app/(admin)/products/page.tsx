import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import type { Pagination, Product, Category } from "../../../lib/types";
import { formatMoney } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import { ProductsToolbar } from "./products-toolbar";
import { DeleteButton } from "./delete-button";
import { CategoryFilter } from "./category-filter";

import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = p(sp, "page") ?? "1";
  const categoryId = p(sp, "categoryId");
  if (q) params.set("q", q);
  if (categoryId) params.set("categoryId", categoryId);
  params.set("page", page);
  params.set("pageSize", "20");

  const [data, categories] = await Promise.all([
    apiFetch<Pagination<Product>>(`/products?${params.toString()}`),
    apiFetch<Category[]>("/categories"),
  ]);

  const columns: Column<Product>[] = [
    {
      header: "Product",
      accessor: (row) => (
        <Link
          href={`/products/${row.id}/edit`}
          className="font-medium text-[var(--admin-fg)] hover:text-[var(--admin-accent)]"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: "SKU",
      accessor: (row) => (
        <span className="font-mono text-xs text-[var(--admin-fg)]/70">
          {row.sku}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: (row) =>
        row.category ? (
          row.category.name
        ) : (
          <span className="text-[var(--admin-fg)]/40">—</span>
        ),
    },
    {
      header: "Base Price",
      accessor: (row) => (
        <span className="font-medium">{formatMoney(row.basePrice)}</span>
      ),
    },
    {
      header: "Tiers",
      accessor: (row) => (
        <span className="text-[var(--admin-fg)]/70">
          {row.tierPrices?.length ?? 0}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {row.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "",
      className: "text-right",
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/products/${row.id}/edit`}
            className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)]"
          >
            Edit
          </Link>
          <DeleteButton id={row.id} />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing tiers, and availability"
        actions={
          <>
            <ProductsToolbar />
            <Link
              href="/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Product
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or SKU" />
        <CategoryFilter categories={categories} selected={categoryId} />
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        emptyText="No products yet. Click Add Product to create one."
      />
      <Pager
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
      />
    </div>
  );
}

