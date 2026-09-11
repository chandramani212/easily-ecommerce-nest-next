import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { LegalContent, Page } from "../../../../lib/types";
import { LegalEditor } from "../legal-editor";

export default async function CookiePolicyContentPage() {
  const page = await apiFetch<Page<LegalContent>>(`/pages/cookie-policy`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Cookie Policy"
        description="Edit the Cookie Policy content and SEO"
      />
      <LegalEditor slug="cookie-policy" page={page} />
    </div>
  );
}
