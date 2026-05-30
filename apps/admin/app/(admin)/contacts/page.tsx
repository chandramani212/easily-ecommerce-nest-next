import { apiFetch } from "../../../lib/api";
import type {
  ContactMessage,
  ContactStatus,
  Pagination,
} from "../../../lib/types";
import { formatDateTime } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { SearchInput } from "../../../components/search-input";
import { Pager } from "../../../components/pagination";
import { StatusFilter } from "../orders/status-filter";
import { ExportButton } from "../../../components/export-button";
import { ContactRow } from "./contact-row";

import { pickParam as p, resolveSearchParams, type SearchParamsRecord as SP } from "../../../lib/search-params";


export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  const page = p(sp, "page") ?? "1";
  const status = p(sp, "status");
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("page", page);
  params.set("pageSize", "20");

  const data = await apiFetch<Pagination<ContactMessage>>(
    `/contact-messages?${params.toString()}`,
  );

  const statuses: ContactStatus[] = ["NEW", "READ", "REPLIED"];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Contact Messages"
        description="Messages sent from the storefront contact form"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, email, or subject" />
        <StatusFilter statuses={statuses} selected={status} />
        <div className="ml-auto">
          <ExportButton
            path="/contact-messages/export"
            filterParams={["q", "status"]}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Received</th>
              <th className="px-4 py-3 text-left font-medium">From</th>
              <th className="px-4 py-3 text-left font-medium">Subject</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-[var(--admin-fg)]/50"
                >
                  No messages yet.
                </td>
              </tr>
            ) : (
              data.items.map((m) => (
                <ContactRow
                  key={m.id}
                  message={m}
                  formattedDate={formatDateTime(m.createdAt)}
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
