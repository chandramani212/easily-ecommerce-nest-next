import { PageHeader } from "../../../../components/page-header";
import { SupplierForm } from "../supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="New Supplier"
        description="Configure a third-party catalog source"
      />
      <SupplierForm />
    </div>
  );
}
