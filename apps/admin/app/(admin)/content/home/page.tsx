import { apiFetch } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { HomeContent, Page } from "../../../../lib/types";
import { HomeEditor } from "./home-editor";

export default async function HomeContentPage() {
  const page = await apiFetch<Page<HomeContent>>(`/pages/home`);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Home page"
        description="Edit the homepage hero slider and SEO"
      />
      <HomeEditor page={page} />
    </div>
  );
}
