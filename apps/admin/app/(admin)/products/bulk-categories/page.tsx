import Link from "next/link";

import { PageHeader } from "../../../../components/page-header";
import { BulkCategoriesClient } from "./bulk-categories-client";

export const metadata = { title: "Bulk category update" };

export default function BulkCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bulk category update"
        description="Export every product with its category path, re-sort it in a spreadsheet, then upload it back."
        actions={
          <Link
            href="/products"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)]"
          >
            Back to products
          </Link>
        }
      />
      <BulkCategoriesClient />
    </div>
  );
}
