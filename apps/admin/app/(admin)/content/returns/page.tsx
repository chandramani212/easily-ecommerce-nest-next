import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function ReturnsContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/returns`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Return & Refund Policy"
        description="Edit the Return & Refund Policy content and SEO"
      />
      <LegalEditor slug="returns" page={page} />
    </div>
  );
}
