"use client";

import { useEffect, useState } from "react";

import { CategorySelect } from "../../../../components/category-select";
import { clientApi, DemoReadOnlyError } from "../../../../lib/client-api";
import type { Category } from "../../../../lib/types";

interface SourceCategoryRow {
  id: string;
  externalId: string;
  name: string;
  parentExternalId: string | null;
  parentName: string | null;
  category: { id: string; name: string; slug: string } | null;
  lastSeenAt: string;
}

type Filter = "all" | "unmapped" | "mapped";

/**
 * Flatten source categories into a depth-annotated, parent-first order so the
 * table can render the source hierarchy with indentation. Keyed on
 * `externalId`/`parentExternalId` (the source's own ids). Rows whose parent is
 * absent from the current (filtered/searched) set surface at depth 0, and their
 * own descendants are walked from there so partial views still show structure.
 */
function buildSourceTree(
  rows: SourceCategoryRow[],
): { row: SourceCategoryRow; depth: number }[] {
  const childrenOf = (parentExternalId: string | null) =>
    rows.filter((r) => (r.parentExternalId ?? null) === parentExternalId);
  const result: { row: SourceCategoryRow; depth: number }[] = [];
  const visited = new Set<string>();

  const walk = (parentExternalId: string | null, depth: number) => {
    for (const node of childrenOf(parentExternalId)) {
      if (visited.has(node.externalId)) continue;
      visited.add(node.externalId);
      result.push({ row: node, depth });
      walk(node.externalId, depth + 1);
    }
  };

  walk(null, 0);

  // Orphans whose parent isn't in the current set — show them as roots and walk
  // any of their descendants that are present.
  for (const r of rows) {
    if (visited.has(r.externalId)) continue;
    visited.add(r.externalId);
    result.push({ row: r, depth: 0 });
    walk(r.externalId, 1);
  }
  return result;
}

export function SourceCategoriesTab({ sourceId }: { sourceId: string }) {
  const [rows, setRows] = useState<SourceCategoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("unmapped");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [options, setOptions] = useState<Category[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("filter", filter);
        if (search) params.set("search", search);
        params.set("take", "200");
        const [list, cats] = await Promise.all([
          clientApi<{ total: number; items: SourceCategoryRow[] }>(
            `/sources/${sourceId}/source-categories?${params.toString()}`,
          ),
          clientApi<Category[] | { items: Category[] }>(
            `/categories`,
          ).catch(() => [] as Category[]),
        ]);
        if (cancelled) return;
        setRows(list.items);
        setTotal(list.total);
        setOptions(Array.isArray(cats) ? cats : cats.items ?? []);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sourceId, filter, search]);

  async function setMapping(rowId: string, categoryId: string | null) {
    setSavingId(rowId);
    setErr(null);
    try {
      const updated = await clientApi<{
        id: string;
        categoryId: string | null;
        category: { id: string; name: string; slug: string } | null;
      }>(`/sources/${sourceId}/source-categories/${rowId}`, {
        method: "PATCH",
        body: JSON.stringify({ categoryId: categoryId ?? "" }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, category: updated.category } : r,
        ),
      );
    } catch (e) {
      setErr(
        e instanceof DemoReadOnlyError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e),
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[var(--admin-border)] p-0.5 text-xs">
          {(["unmapped", "mapped", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 capitalize ${
                filter === f
                  ? "bg-[var(--admin-accent)] text-white"
                  : "text-[var(--admin-fg)]/70 hover:bg-[var(--admin-muted)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search by name or external ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--admin-accent)]"
        />
        <span className="text-xs text-[var(--admin-fg)]/60">
          {total} total
        </span>
      </div>

      {err && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </p>
      )}

      {/*
        No `overflow-hidden` here — the CategorySelect dropdown is
        position:absolute, and an overflow:hidden ancestor would clip the
        popover when it extends past the table's last row. Rounded corners
        are applied to the first/last header + cells instead.
      */}
      <div className="rounded-xl border border-[var(--admin-border)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--admin-muted)] text-left text-xs uppercase text-[var(--admin-fg)]/60">
            <tr>
              <th className="rounded-tl-xl px-3 py-2">Source category</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">External ID</th>
              <th className="w-[280px] rounded-tr-xl px-3 py-2">Mapped to (curated)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[var(--admin-fg)]/60">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[var(--admin-fg)]/60">
                  Nothing here yet — run an import with hierarchy-mode mapping
                  enabled and source categories will show up.
                </td>
              </tr>
            )}
            {!loading &&
              buildSourceTree(rows).map(({ row: r, depth }) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--admin-border)] hover:bg-[var(--admin-muted)]/40"
                >
                  <td className="px-3 py-2 font-medium">
                    <div
                      className="flex items-center gap-1.5"
                      style={{ paddingLeft: `${depth * 1.25}rem` }}
                    >
                      {depth > 0 && (
                        <span className="text-[var(--admin-fg)]/30">↳</span>
                      )}
                      {r.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--admin-fg)]/70">
                    {r.parentName ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--admin-fg)]/60">
                    {r.externalId}
                  </td>
                  <td className="px-3 py-2">
                    <CategorySelect
                      value={r.category?.id ?? ""}
                      onChange={(id) => setMapping(r.id, id || null)}
                      categories={options}
                      placeholder="— Unmapped —"
                      disabled={savingId === r.id}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
