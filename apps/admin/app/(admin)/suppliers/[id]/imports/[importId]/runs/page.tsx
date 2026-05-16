import Link from "next/link";

import { apiFetch } from "../../../../../../../lib/api";
import { PageHeader } from "../../../../../../../components/page-header";
import { Pager } from "../../../../../../../components/pagination";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../../../../../lib/search-params";
import type {
  SupplierImport,
  SupplierImportRun,
} from "../../../../../../../lib/types";
import { RunsTable } from "./runs-table";

interface DemoMockExports {
  mockSupplierImports?: SupplierImport[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import(
    "../../../../../../../lib/mock-data"
  )) as DemoMockExports;
  return (mod.mockSupplierImports ?? []).map((imp) => ({
    id: imp.supplierId,
    importId: imp.id,
  }));
}

export default async function RunHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; importId: string }>;
  searchParams: Promise<SP>;
}) {
  const { id, importId } = await params;
  const sp = await resolveSearchParams(searchParams);
  const page = Math.max(1, Number(p(sp, "page") ?? "1"));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [imp, runs] = await Promise.all([
    apiFetch<SupplierImport>(`/suppliers/${id}/imports/${importId}`),
    apiFetch<{ items: SupplierImportRun[]; total: number }>(
      `/suppliers/${id}/imports/${importId}/runs?take=${pageSize}&skip=${skip}`,
    ),
  ]);
  const pageCount = Math.ceil(runs.total / pageSize);
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={`${imp.name} · runs`}
        description="Latest synchronization attempts and their outcomes"
        actions={
          <Link
            href={`/suppliers/${id}/imports/${importId}`}
            className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
          >
            Back to import
          </Link>
        }
      />
      <RunsTable runs={runs.items} />
      <Pager page={page} pageCount={pageCount} total={runs.total} />
    </div>
  );
}
