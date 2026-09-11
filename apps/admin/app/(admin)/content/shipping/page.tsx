import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function ShippingContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/shipping`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Shipping & Delivery Policy"
        description="Edit the Shipping & Delivery Policy content and SEO"
      />
      <LegalEditor slug="shipping" page={page} />
    </div>
  );
}
