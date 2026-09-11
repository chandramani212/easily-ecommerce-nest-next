import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function AccessibilityContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/accessibility`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Accessibility Statement"
        description="Edit the Accessibility Statement content and SEO"
      />
      <LegalEditor slug="accessibility" page={page} />
    </div>
  );
}
