import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import type { Order, OrderStatus, Pagination } from "../../../lib/types";
import { formatDate, formatMoney } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import { StatusBadge } from "../../../components/status-badge";
import { DateRangeFilter } from "../../../components/date-range-filter";
import { StatusFilter } from "./status-filter";

import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = p(sp, "page") ?? "1";
  const status = p(sp, "status");
  const dateFrom = p(sp, "dateFrom");
  const dateTo = p(sp, "dateTo");
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", page);
  params.set("pageSize", "20");

  const data = await apiFetch<Pagination<Order>>(
    `/orders?${params.toString()}`,
  );

  const columns: Column<Order>[] = [
    {
      header: "Order #",
      accessor: (o) => (
        <Link
          href={`/orders/${o.id}`}
          className="font-mono text-xs font-medium hover:text-[var(--admin-accent)]"
        >
          {o.orderNumber}
        </Link>
      ),
    },
    {
      header: "Customer",
      accessor: (o) =>
        o.customer ? (
          <Link
            href={`/customers/${o.customer.id}`}
            className="hover:text-[var(--admin-accent)]"
          >
            {o.customer.firstName} {o.customer.lastName}
          </Link>
        ) : (
          <span className="text-[var(--admin-fg)]/40">—</span>
        ),
    },
    {
      header: "Status",
      accessor: (o) => <StatusBadge value={o.status} />,
    },
    {
      header: "Items",
      accessor: (o) => o._count?.items ?? 0,
    },
    {
      header: "Total",
      accessor: (o) => (
        <span className="font-medium">{formatMoney(o.total)}</span>
      ),
    },
    {
      header: "Placed",
      accessor: (o) => formatDate(o.createdAt),
    },
  ];

  const statuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Orders"
        description="Filter by status, customer, and date range"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by order # or customer" />
        <StatusFilter statuses={statuses} selected={status} />
        <DateRangeFilter />
      </div>
      <DataTable
        columns={columns}
        rows={data.items}
        emptyText="No orders match the filters"
      />
      <Pager page={data.page} pageCount={data.pageCount} total={data.total} />
    </div>
  );
}
