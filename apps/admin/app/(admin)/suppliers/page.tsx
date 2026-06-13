import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import type { Supplier, SupplierListResponse } from "../../../lib/types";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

const ORIGIN_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  FEED: "From feed",
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = Math.max(1, Number(p(sp, "page") ?? "1"));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  if (q) params.set("search", q);
  params.set("take", String(pageSize));
  params.set("skip", String(skip));

  const data = await apiFetch<SupplierListResponse>(
    `/suppliers?${params.toString()}`,
  );
  const suppliers = data.items;
  const pageCount = Math.ceil(data.total / pageSize);

  const columns: Column<Supplier>[] = [
    {
      header: "Supplier",
      accessor: (row) => (
        <Link
          href={`/suppliers/${row.id}`}
          className="font-medium text-[var(--admin-fg)] hover:text-[var(--admin-accent)]"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: "Source",
      accessor: (row) =>
        row.source ? (
          <Link
            href={`/sources/${row.source.id}`}
            className="text-sm text-[var(--admin-fg)]/80 hover:text-[var(--admin-accent)]"
          >
            {row.source.name}
          </Link>
        ) : (
          <span className="text-[var(--admin-fg)]/40">—</span>
        ),
    },
    {
      header: "Origin",
      accessor: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.origin === "MANUAL"
              ? "bg-blue-100 text-blue-700"
              : "bg-violet-100 text-violet-700"
          }`}
        >
          {ORIGIN_LABEL[row.origin] ?? row.origin}
        </span>
      ),
    },
    {
      header: "Phone",
      accessor: (row) => (
        <span className="text-sm text-[var(--admin-fg)]/70">
          {row.phone || row.tollFree || "—"}
        </span>
      ),
    },
    {
      header: "Products",
      accessor: (row) => (
        <span className="text-[var(--admin-fg)]/70">{row.productCount ?? 0}</span>
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
        <Link
          href={`/suppliers/${row.id}`}
          className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)]"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Suppliers"
        description="The real companies behind your sources — direct suppliers and aggregator vendors"
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, phone, or website" />
      </div>

      <DataTable
        columns={columns}
        rows={suppliers}
        emptyText="No suppliers yet. Add a manual supplier on a Source, or run an aggregator import to capture them automatically."
      />
      <Pager page={page} pageCount={pageCount} total={data.total} />
    </div>
  );
}
