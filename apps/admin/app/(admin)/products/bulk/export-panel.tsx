"use client";

import { useEffect, useState } from "react";

import { clientApi } from "../../../../lib/client-api";

interface FieldGroup {
  key: string;
  label: string;
  columns: string[];
}

const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";
const BTN_PRIMARY =
  "rounded-lg bg-[var(--admin-fg)] px-4 py-2 text-sm font-semibold text-[var(--admin-bg)] transition-opacity hover:opacity-90 disabled:opacity-40";

/**
 * Field picker + download buttons for the product CSV. The field list comes
 * from the API (GET /products/bulk/fields) so it always matches what the
 * export writes and the import reads. Downloads are plain links: the export
 * streams straight to disk instead of being buffered in the browser, which
 * matters at 130k products.
 */
export function ExportPanel() {
  const [groups, setGroups] = useState<FieldGroup[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi<FieldGroup[]>("/products/bulk/fields")
      .then((g) => {
        setGroups(g);
        setSelected(new Set(g.map((x) => x.key)));
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load fields"),
      );
  }, []);

  const allOn = !!groups && selected.size === groups.length;
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const href = (sample: boolean) => {
    const params = new URLSearchParams();
    // Keep the API's group order regardless of click order.
    params.set(
      "fields",
      (groups ?? []).filter((g) => selected.has(g.key)).map((g) => g.key).join(","),
    );
    if (sample) params.set("sample", "1");
    return `/api/proxy/products/bulk/export?${params.toString()}`;
  };

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!groups) return <p className="text-sm text-[var(--admin-fg)]/60">Loading fields…</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--admin-fg)]/60">
          Fields to include{" "}
          <span className="text-xs">(SKU is always included)</span>
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allOn}
            onChange={() =>
              setSelected(allOn ? new Set() : new Set(groups.map((g) => g.key)))
            }
            className="h-4 w-4"
          />
          Select all
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <label
            key={g.key}
            title={g.columns.join(", ")}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm hover:bg-[var(--admin-muted)]"
          >
            <input
              type="checkbox"
              checked={selected.has(g.key)}
              onChange={() => toggle(g.key)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="min-w-0">
              <span className="block font-medium">{g.label}</span>
              <span className="block truncate font-mono text-[11px] text-[var(--admin-fg)]/50">
                {g.columns.length > 4
                  ? `${g.columns.slice(0, 2).join(", ")} … (${g.columns.length} columns)`
                  : g.columns.join(", ")}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={href(true)}
          aria-disabled={selected.size === 0}
          className={`${BTN} ${selected.size === 0 ? "pointer-events-none opacity-50" : ""}`}
        >
          Download sample
        </a>
        <a
          href={href(false)}
          aria-disabled={selected.size === 0}
          className={`${BTN_PRIMARY} ${selected.size === 0 ? "pointer-events-none opacity-40" : ""}`}
        >
          Export all products
        </a>
      </div>
      <p className="mt-2 text-xs text-[var(--admin-fg)]/50">
        The sample has the same columns with a few real products, so you can see
        the format. A full export of every field is about 150&nbsp;MB.
      </p>
    </div>
  );
}
