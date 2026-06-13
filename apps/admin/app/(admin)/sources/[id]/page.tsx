import Link from "next/link";

import { apiFetch, apiFetchSafe } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type {
  Source,
  SourceImportRun,
  SourceProductLinkEntry,
} from "../../../../lib/types";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../../lib/search-params";
import { SourceDetailTabs, type Tab } from "./source-detail-tabs";
import { SourceActivity } from "./source-activity";
import { SourceCategoriesTab } from "./source-categories-tab";
import { SourceProducts } from "./source-products";
import { SourceImportsTab } from "./source-imports-tab";
import { SourceOverview } from "./source-overview";

interface DemoMockExports {
  mockSources?: Source[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import("../../../../lib/mock-data")) as DemoMockExports;
  return (mod.mockSources ?? []).map((s) => ({ id: s.id }));
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "imports", label: "Imports" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "activity", label: "Activity" },
];

export default async function SourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await resolveSearchParams(searchParams);
  const activeTab = (p(sp, "tab") ?? "overview") as Tab["id"];

  const source = await apiFetch<Source>(`/sources/${id}`);

  // Fetch the data slice for the active tab. Other tabs lazy-load on visit.
  let productsData: { total: number; items: SourceProductLinkEntry[] } | null = null;
  let productsPage = 1;
  let activityData: SourceImportRun[] | null = null;

  if (activeTab === "products") {
    productsPage = Math.max(1, Number(p(sp, "productsPage") ?? "1"));
    const productsSkip = (productsPage - 1) * 20;
    productsData = await apiFetchSafe<typeof productsData>(
      `/sources/${id}/products?take=20&skip=${productsSkip}`,
    );
  }
  if (activeTab === "activity") {
    // Aggregate latest runs across all imports.
    const runs: SourceImportRun[] = [];
    for (const imp of source.imports ?? []) {
      const data = await apiFetchSafe<{ items: SourceImportRun[] }>(
        `/sources/${id}/imports/${imp.id}/runs?take=10`,
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
        title={source.name}
        description={source.baseUrl ?? "File-feed source"}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/sources/${id}/edit`}
              className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              Edit
            </Link>
            <Link
              href={`/sources/${id}/imports/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + New Import
            </Link>
          </div>
        }
      />

      <SourceDetailTabs sourceId={id} tabs={TABS} active={activeTab} />

      {activeTab === "overview" && <SourceOverview source={source} />}
      {activeTab === "imports" && (
        <SourceImportsTab sourceId={id} imports={source.imports ?? []} />
      )}
      {activeTab === "products" && (
        <SourceProducts
          data={productsData ?? { total: 0, items: [] }}
          page={productsPage}
          pageSize={20}
        />
      )}
      {activeTab === "categories" && (
        <SourceCategoriesTab sourceId={id} />
      )}
      {activeTab === "activity" && (
        <SourceActivity sourceId={id} runs={activityData ?? []} />
      )}
    </div>
  );
}
