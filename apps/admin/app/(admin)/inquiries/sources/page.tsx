import Link from "next/link";

import { apiFetch } from "../../../../lib/api";
import type { LeadSourceDef } from "../../../../lib/types";
import { PageHeader } from "../../../../components/page-header";
import { SourcesClient } from "./sources-client";

export const metadata = { title: "Lead sources" };

export default async function LeadSourcesPage() {
  const sources = await apiFetch<LeadSourceDef[]>("/lead-sources");
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Lead sources"
        description="The buckets inquiries are sorted into, and the rules that decide which one a new lead lands in."
        actions={
          <Link
            href="/inquiries"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)]"
          >
            Back to inquiries
          </Link>
        }
      />
      <SourcesClient initial={sources} />
    </div>
  );
}
