import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function PrivacyContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/privacy`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Privacy Policy"
        description="Edit the Privacy Policy content and SEO"
      />
      <LegalEditor slug="privacy" page={page} />
    </div>
  );
}
