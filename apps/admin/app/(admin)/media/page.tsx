import { apiFetch } from "../../../lib/api";
import { PageHeader } from "../../../components/page-header";
import type { MediaAsset, Pagination } from "../../../lib/types";
import { MediaManager } from "./media-manager";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../lib/search-params";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const params = new URLSearchParams();
  const q = p(sp, "q");
  if (q) params.set("q", q);
  params.set("pageSize", "60");

  const data = await apiFetch<Pagination<MediaAsset>>(
    `/media?${params.toString()}`,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Media Library"
        description="Centralized place for product images and other uploads."
      />
      <MediaManager initial={data} initialQuery={q ?? ""} />
    </div>
  );
}
