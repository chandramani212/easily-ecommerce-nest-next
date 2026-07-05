import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function TermsContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/terms`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Terms & Conditions"
        description="Edit the Terms & Conditions content and SEO"
      />
      <LegalEditor slug="terms" page={page} />
    </div>
  );
}
