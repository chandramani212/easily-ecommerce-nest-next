import { apiFetch } from "../../../../../lib/api";
import { PageHeader } from "../../../../../components/page-header";
import type { Supplier } from "../../../../../lib/types";
import { SupplierForm } from "../../supplier-form";

interface DemoMockExports {
  mockSuppliers?: Supplier[];
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return [];
  const mod = (await import("../../../../../lib/mock-data")) as DemoMockExports;
  return (mod.mockSuppliers ?? []).map((s) => ({ id: s.id }));
}

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await apiFetch<Supplier>(`/suppliers/${id}`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title={`Edit ${supplier.name}`}
        description="Update supplier connection and credentials"
      />
      <SupplierForm supplier={supplier} />
    </div>
  );
}
