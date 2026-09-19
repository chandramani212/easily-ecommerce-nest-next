import Link from "next/link";

import { PageHeader } from "../../../../components/page-header";
import { BulkClient } from "./bulk-client";

export const metadata = { title: "Import / export products" };

export default function BulkProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import / export products"
        description="Export products to CSV, edit any field in a spreadsheet — prices, quantity prices, categories, SEO and more — then upload it back."
        actions={
          <Link
            href="/products"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)]"
          >
            Back to products
          </Link>
        }
      />
      <BulkClient />
    </div>
  );
}
