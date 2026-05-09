import Link from "next/link";

import { apiFetch, apiFetchSafe } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type {
  Supplier,
  SupplierImportRun,
  SupplierProductLinkEntry,
} from "../../../../lib/types";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../../lib/search-params";
import { SupplierDetailTabs, type Tab } from "./supplier-detail-tabs";
import { SupplierActivity } from "./supplier-activity";
import { SupplierProducts } from "./supplier-products";
import { SupplierImportsTab } from "./supplier-imports-tab";
import { SupplierOverview } from "./supplier-overview";

interface DemoMockExports {
  mockSuppliers?: Supplier[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import("../../../../lib/mock-data")) as DemoMockExports;
  return (mod.mockSuppliers ?? []).map((s) => ({ id: s.id }));
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "imports", label: "Imports" },
  { id: "products", label: "Products" },
  { id: "activity", label: "Activity" },
];

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await resolveSearchParams(searchParams);
  const activeTab = (p(sp, "tab") ?? "overview") as Tab["id"];

  const supplier = await apiFetch<Supplier>(`/suppliers/${id}`);

  // Fetch the data slice for the active tab. Other tabs lazy-load on visit.
  let productsData: { total: number; items: SupplierProductLinkEntry[] } | null = null;
  let activityData: SupplierImportRun[] | null = null;

  if (activeTab === "products") {
    productsData = await apiFetchSafe<typeof productsData>(
      `/suppliers/${id}/products?take=50`,
    );
  }
  if (activeTab === "activity") {
    // Aggregate latest runs across all imports.
    const runs: SupplierImportRun[] = [];
    for (const imp of supplier.imports ?? []) {
      const data = await apiFetchSafe<{ items: SupplierImportRun[] }>(
        `/suppliers/${id}/imports/${imp.id}/runs?take=10`,
      );
      runs.push(...(data?.items ?? []));
    }
    runs.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    activityData = runs.slice(0, 50);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={supplier.name}
        description={supplier.baseUrl ?? "File-feed supplier"}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/suppliers/${id}/edit`}
              className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              Edit
            </Link>
            <Link
              href={`/suppliers/${id}/imports/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + New Import
            </Link>
          </div>
        }
      />

      <SupplierDetailTabs supplierId={id} tabs={TABS} active={activeTab} />

      {activeTab === "overview" && <SupplierOverview supplier={supplier} />}
      {activeTab === "imports" && (
        <SupplierImportsTab supplierId={id} imports={supplier.imports ?? []} />
      )}
      {activeTab === "products" && (
        <SupplierProducts data={productsData ?? { total: 0, items: [] }} />
      )}
      {activeTab === "activity" && (
        <SupplierActivity supplierId={id} runs={activityData ?? []} />
      )}
    </div>
  );
}
