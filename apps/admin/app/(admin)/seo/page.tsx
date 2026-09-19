import { apiFetch } from "../../../lib/api";
import type { SeoStatus, Settings } from "../../../lib/types";
import { PageHeader } from "../../../components/page-header";
import { SeoClient } from "./seo-client";

export const metadata = { title: "SEO & Feeds" };

export default async function SeoPage() {
  const [status, settings] = await Promise.all([
    apiFetch<SeoStatus>("/seo/status"),
    apiFetch<Settings>("/settings"),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="SEO & Feeds"
        description="XML sitemaps for search engines and the Google Merchant Center product feed."
      />
      <SeoClient initial={status} settings={settings} />
    </div>
  );
}
