import { apiFetchSafe } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type { Source } from "../../../../lib/types";
import { SourceCategoriesClient } from "./source-categories-client";

export default async function ProductSourceCategoriesPage() {
  const data = await apiFetchSafe<{ items: Source[]; total: number }>(
    `/sources?take=100`,
  );
  const sources = data?.items ?? [];

  // Default to the ASI source when present, otherwise the first source.
  const defaultSource =
    sources.find((s) => s.kind === "ASI_CENTRAL") ?? sources[0];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Source Categories"
        description="Map supplier categories to your curated catalog, then sync product categories."
      />

      {sources.length === 0 ? (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-muted)] px-3 py-6 text-center text-sm text-[var(--admin-fg)]/60">
          No sources found. Add a source first to manage its categories.
        </p>
      ) : (
        <SourceCategoriesClient
          sources={sources.map((s) => ({ id: s.id, name: s.name }))}
          defaultSourceId={defaultSource?.id ?? ""}
        />
      )}
    </div>
  );
}
