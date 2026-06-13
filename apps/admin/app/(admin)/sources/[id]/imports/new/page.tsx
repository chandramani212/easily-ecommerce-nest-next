import { PageHeader } from "../../../../../../components/page-header";
import { ImportWizard } from "../import-wizard";

interface DemoMockExports {
  mockSources?: { id: string }[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import(
    "../../../../../../lib/mock-data"
  )) as DemoMockExports;
  return (mod.mockSources ?? []).map((s) => ({ id: s.id }));
}

export default async function NewImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="New Import"
        description="Configure a product feed: source, mapping, pricing markup and schedule"
      />
      <ImportWizard sourceId={id} />
    </div>
  );
}
