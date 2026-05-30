import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import type { Customer, Pagination } from "../../../lib/types";
import { formatDate } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import { DateRangeFilter } from "../../../components/date-range-filter";
import { ExportButton } from "../../../components/export-button";

import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = p(sp, "page") ?? "1";
  const createdFrom = p(sp, "createdFrom");
  const createdTo = p(sp, "createdTo");
  if (q) params.set("q", q);
  if (createdFrom) params.set("createdFrom", createdFrom);
  if (createdTo) params.set("createdTo", createdTo);
  params.set("page", page);
  params.set("pageSize", "20");

  const data = await apiFetch<Pagination<Customer>>(
    `/customers?${params.toString()}`,
  );

  const columns: Column<Customer>[] = [
    {
      header: "Name",
      accessor: (c) => (
        <Link
          href={`/customers/${c.id}`}
          className="font-medium hover:text-[var(--admin-accent)]"
        >
          {c.firstName} {c.lastName}
        </Link>
      ),
    },
    {
      header: "Email",
      accessor: (c) => <span className="text-[var(--admin-fg)]/80">{c.email}</span>,
    },
    {
      header: "Company",
      accessor: (c) =>
        c.company || <span className="text-[var(--admin-fg)]/40">—</span>,
    },
    {
      header: "Phone",
      accessor: (c) =>
        c.phone || <span className="text-[var(--admin-fg)]/40">—</span>,
    },
    {
      header: "Orders",
      accessor: (c) => c._count?.orders ?? 0,
    },
    {
      header: "Joined",
      accessor: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Customers"
        description="Search and review your customer accounts"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, email, or company" />
        <DateRangeFilter fromParam="createdFrom" toParam="createdTo" />
        <div className="ml-auto">
          <ExportButton
            path="/customers/export"
            filterParams={["q", "createdFrom", "createdTo"]}
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={data.items}
        emptyText="No customers found"
      />
      <Pager page={data.page} pageCount={data.pageCount} total={data.total} />
    </div>
  );
}
