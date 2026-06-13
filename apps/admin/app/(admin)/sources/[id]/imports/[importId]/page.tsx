import Link from "next/link";

import { apiFetch } from "../../../../../../lib/api";
import { PageHeader } from "../../../../../../components/page-header";
import type { Source, SourceImport } from "../../../../../../lib/types";
import { ImportWizard } from "../import-wizard";

interface DemoMockExports {
  mockSources?: Source[];
  mockSourceImports?: SourceImport[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import(
    "../../../../../../lib/mock-data"
  )) as DemoMockExports;
  const out: { id: string; importId: string }[] = [];
  for (const imp of mod.mockSourceImports ?? []) {
    out.push({ id: imp.sourceId, importId: imp.id });
  }
  return out;
}

export default async function EditImportPage({
  params,
}: {
  params: Promise<{ id: string; importId: string }>;
}) {
  const { id, importId } = await params;
  const imp = await apiFetch<SourceImport>(
    `/sources/${id}/imports/${importId}`,
  );
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={`Edit ${imp.name}`}
        description="Adjust source, mapping, markup and schedule for this import"
        actions={
          <div className="flex gap-2">
            <Link
              href={`/sources/${id}?tab=imports`}
              className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              ← Back to imports
            </Link>
            <Link
              href={`/sources/${id}/imports/${importId}/runs`}
              className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              Run history
            </Link>
          </div>
        }
      />
      <ImportWizard sourceId={id} imp={imp} />
    </div>
  );
}
