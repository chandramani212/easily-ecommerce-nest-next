import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { AboutContent, Page } from "../../../../lib/types";
import { AboutEditor } from "./about-editor";

export default async function AboutContentPage() {
  const page = await apiFetch<Page<AboutContent>>(`/pages/about`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="About page" description="Edit the About Us content and SEO" />
      <AboutEditor page={page} />
    </div>
  );
}
