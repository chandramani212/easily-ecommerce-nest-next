"use client";

import { useState } from "react";

import { SourceCategoriesTab } from "../../sources/[id]/source-categories-tab";

export interface SourceOption {
  id: string;
  name: string;
}

export function SourceCategoriesClient({
  sources,
  defaultSourceId,
}: {
  sources: SourceOption[];
  defaultSourceId: string;
}) {
  const [sourceId, setSourceId] = useState(defaultSourceId);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="source-select"
          className="text-sm font-medium text-[var(--admin-fg)]/70"
        >
          Source
        </label>
        <select
          id="source-select"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="min-w-[220px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--admin-accent)]"
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Remount on source change so the tab's internal filters/rows reset. */}
      {sourceId && <SourceCategoriesTab key={sourceId} sourceId={sourceId} />}
    </section>
  );
}
