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

interface BackfillStatus {
  running: boolean;
  total: number;
  processed: number;
  productsConnected: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

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

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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
  const [resync, setResync] = useState<BackfillStatus | null>(null);
  const [startingResync, setStartingResync] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load current resync job status once (a job may already be running).
  useEffect(() => {
    clientApi<BackfillStatus>(`/sources/${sourceId}/categorize-products/resync/status`)
      .then(setResync)
      .catch(() => {});
  }, [sourceId]);

  useEffect(() => {
    if (!resync?.running) return;
    const t = setTimeout(async () => {
      try {
        setResync(
          await clientApi<BackfillStatus>(
            `/sources/${sourceId}/categorize-products/resync/status`,
          ),
        );
      } catch {
        /* keep last known status */
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [resync, sourceId]);

  function jobError(e: unknown): string {
    return e instanceof DemoReadOnlyError
      ? e.message
      : e instanceof Error
        ? e.message
        : String(e);
  }

  async function exportCsv() {
    setExporting(true);
    setErr(null);
    try {
      // Page through the full set for this source (the list endpoint caps
      // `take` at 200) so the export always covers every category, not just
      // the current filtered/searched view.
      const pageSize = 200;
      const all: SourceCategoryRow[] = [];
      let skip = 0;
      for (;;) {
        const page = await clientApi<{ total: number; items: SourceCategoryRow[] }>(
          `/sources/${sourceId}/source-categories?take=${pageSize}&skip=${skip}`,
        );
        all.push(...page.items);
        if (page.items.length === 0 || all.length >= page.total) break;
        skip += pageSize;
      }

      // Resolve a mapped curated category to its root-first path (the curated
      // tree is up to 3 levels) so the export shows the full hierarchy, not
      // just the leaf. `options` holds the full flat category list with parents.
      const catById = new Map(options.map((c) => [c.id, c]));
      const mappedPath = (id?: string): string[] => {
        const path: string[] = [];
        const seen = new Set<string>();
        let cur = id ? catById.get(id) : undefined;
        while (cur && !seen.has(cur.id)) {
          seen.add(cur.id);
          path.unshift(cur.name);
          cur = cur.parentId ? catById.get(cur.parentId) : undefined;
        }
        return path;
      };

      const header = [
        "Level 1 source category",
        "Level 2 source category",
        "Mapped category L1",
        "Mapped category L2",
        "Mapped category L3",
      ];
      // Place each source row by its hierarchy level: a top-level (level 1)
      // category goes in column 1 with column 2 blank; a child (level 2) keeps
      // its level-1 parent in column 1 and its own name in column 2.
      const lines = [
        header,
        ...all.map((r) => {
          const isChild = !!r.parentExternalId;
          const level1 = isChild ? r.parentName ?? "" : r.name;
          const level2 = isChild ? r.name : "";
          // Fall back to the leaf name if the full list didn't load.
          const path = r.category
            ? mappedPath(r.category.id).length
              ? mappedPath(r.category.id)
              : [r.category.name]
            : [];
          return [level1, level2, path[0] ?? "", path[1] ?? "", path[2] ?? ""];
        }),
      ];
      // Prefix a BOM so Excel opens the UTF-8 file with the right encoding.
      const csv =
        "﻿" + lines.map((cols) => cols.map(csvCell).join(",")).join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `source-categories-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(jobError(e));
    } finally {
      setExporting(false);
    }
  }

  async function startResync() {
    setStartingResync(true);
    setErr(null);
    try {
      setResync(
        await clientApi<BackfillStatus>(
          `/sources/${sourceId}/categorize-products/resync`,
          { method: "POST" },
        ),
      );
    } catch (e) {
      setErr(jobError(e));
    } finally {
      setStartingResync(false);
    }
  }

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

        <button
          onClick={startResync}
          disabled={startingResync || resync?.running}
          title="Re-apply the current mapping to products locally (no ASI). Use after changing the mapping."
          className="ml-auto rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium text-[var(--admin-fg)] hover:bg-[var(--admin-muted)] disabled:opacity-60"
        >
          {resync?.running || startingResync ? "Updating…" : "Update product categories"}
        </button>
        <button
          onClick={exportCsv}
          disabled={exporting}
          title="Download all source categories for this source as CSV: parent source category, child source category, mapped category."
          className="rounded-lg bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {resync?.running && (
        <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-muted)] px-3 py-2 text-xs text-[var(--admin-fg)]/80">
          Updating product categories locally —{" "}
          <strong>{resync.processed.toLocaleString()}</strong>/
          {resync.total.toLocaleString()} products.
        </div>
      )}
      {resync && !resync.running && resync.finishedAt && (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-700">
          {resync.error
            ? `Update stopped: ${resync.error}`
            : `Updated ${resync.processed.toLocaleString()} products from the current mapping.`}
        </div>
      )}

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
