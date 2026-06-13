import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import type { Source } from "../../../lib/types";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

const KIND_LABEL: Record<string, string> = {
  REST: "REST API",
  FILE_FEED: "File feed",
};

const AUTH_LABEL: Record<string, string> = {
  NONE: "None",
  API_KEY: "API key",
  BASIC: "Basic",
  BEARER: "Bearer",
  OAUTH2_CLIENT_CREDENTIALS: "OAuth2 (CC)",
};

export default async function SourcesPage({
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

  const data = await apiFetch<{ items: Source[]; total: number }>(
    `/sources?${params.toString()}`,
  );
  const sources = data.items;
  const pageCount = Math.ceil(data.total / pageSize);

  const columns: Column<Source>[] = [
    {
      header: "Source",
      accessor: (row) => (
        <Link
          href={`/sources/${row.id}`}
          className="font-medium text-[var(--admin-fg)] hover:text-[var(--admin-accent)]"
        >
          {row.name}
        </Link>
      ),
    },
    {
      header: "Type",
      accessor: (row) => (
        <span className="text-sm text-[var(--admin-fg)]/80">
          {KIND_LABEL[row.kind] ?? row.kind}
        </span>
      ),
    },
    {
      header: "Auth",
      accessor: (row) => (
        <span className="text-xs text-[var(--admin-fg)]/70">
          {AUTH_LABEL[row.authType] ?? row.authType}
        </span>
      ),
    },
    {
      header: "Imports",
      accessor: (row) => (
        <span className="text-[var(--admin-fg)]/70">{row.importCount ?? 0}</span>
      ),
    },
    {
      header: "Products",
      accessor: (row) => (
        <span className="text-[var(--admin-fg)]/70">{row.productCount ?? 0}</span>
      ),
    },
    {
      header: "Markup",
      accessor: (row) =>
        row.defaultMarkupPct > 0 ? (
          <span className="text-[var(--admin-fg)]/80">
            {row.defaultMarkupPct.toFixed(2)}%
          </span>
        ) : (
          <span className="text-[var(--admin-fg)]/40">—</span>
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
          href={`/sources/${row.id}`}
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
        title="Sources"
        description="Connect third-party catalogs and schedule product syncs"
        actions={
          <Link
            href="/sources/new"
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
            Add Source
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or base URL" />
      </div>

      <DataTable
        columns={columns}
        rows={sources}
        emptyText="No sources yet. Add one to start importing products."
      />
      <Pager page={page} pageCount={pageCount} total={data.total} />
    </div>
  );
}
