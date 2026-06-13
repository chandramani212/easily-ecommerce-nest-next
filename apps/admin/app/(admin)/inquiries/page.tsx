import { apiFetch } from "../../../lib/api";
import type { Inquiry, InquiryStatus, Pagination } from "../../../lib/types";
import { formatDateTime } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import { StatusFilter } from "../orders/status-filter";
import { ExportButton } from "../../../components/export-button";
import { InquiryRow } from "./inquiry-row";

import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = p(sp, "page") ?? "1";
  const status = p(sp, "status");
  const source = p(sp, "source");
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (source) params.set("source", source);
  params.set("page", page);
  params.set("pageSize", "20");

  const data = await apiFetch<Pagination<Inquiry>>(
    `/inquiries?${params.toString()}`,
  );

  const statuses: InquiryStatus[] = ["NEW", "IN_PROGRESS", "CLOSED"];
  const sources = ["organic", "paid", "social", "referral", "email", "direct"];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Inquiries"
        description="Customer product inquiries from the storefront"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search name, email, or message" />
        <StatusFilter statuses={statuses} selected={status} />
        <StatusFilter
          statuses={sources}
          selected={source}
          paramName="source"
          label="All sources"
        />
        <div className="ml-auto">
          <ExportButton
            path="/inquiries/export"
            filterParams={["q", "status", "source"]}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Received</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Type / Product</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Message</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-[var(--admin-fg)]/50"
                >
                  No inquiries yet.
                </td>
              </tr>
            ) : (
              data.items.map((inq) => (
                <InquiryRow
                  key={inq.id}
                  inquiry={inq}
                  formattedDate={formatDateTime(inq.createdAt)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager page={data.page} pageCount={data.pageCount} total={data.total} />
    </div>
  );
}
