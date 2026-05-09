import Link from "next/link";

import { apiFetch } from "../../../../../../../lib/api";
import { PageHeader } from "../../../../../../../components/page-header";
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
}: {
  params: Promise<{ id: string; importId: string }>;
}) {
  const { id, importId } = await params;
  const [imp, runs] = await Promise.all([
    apiFetch<SupplierImport>(`/suppliers/${id}/imports/${importId}`),
    apiFetch<{ items: SupplierImportRun[]; total: number }>(
      `/suppliers/${id}/imports/${importId}/runs?take=50`,
    ),
  ]);
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
    </div>
  );
}
