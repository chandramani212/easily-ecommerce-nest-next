import { apiFetch, apiFetchSafe } from "../../../../../lib/api";
import { PageHeader } from "../../../../../components/page-header";
import type { Source, Supplier } from "../../../../../lib/types";
import { SourceForm } from "../../source-form";

interface DemoMockExports {
  mockSources?: Source[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import("../../../../../lib/mock-data")) as DemoMockExports;
  return (mod.mockSources ?? []).map((s) => ({ id: s.id }));
}

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await apiFetch<Source>(`/sources/${id}`);
  const manualSupplier = await apiFetchSafe<Supplier | null>(
    `/sources/${id}/supplier`,
  );
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={`Edit ${source.name}`}
        description="Update source connection and credentials"
      />
      <SourceForm source={source} manualSupplier={manualSupplier} />
    </div>
  );
}
