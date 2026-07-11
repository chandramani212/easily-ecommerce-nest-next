"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clientApi,
  DemoReadOnlyError,
} from "../../../../lib/client-api";
import { formatDateTime } from "../../../../lib/format";
import type {
  SourceImportRun,
  SourceImportSummary,
} from "../../../../lib/types";

interface SupplierOption {
  externalId: string;
  name: string;
  productLinkCount?: number;
  productCount?: number;
}

const STATUS_BADGE: Record<string, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

export function SourceImportsTab({
  sourceId,
  imports,
}: {
  sourceId: string;
  imports: SourceImportSummary[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Live progress per import id, populated by polling the run row while it runs.
  const [progress, setProgress] = useState<Record<string, SourceImportRun>>({});
  // Supplier picker (scoped run): the import id whose picker is open, the fetched
  // suppliers, and the selected externalIds.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supLoading, setSupLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [supSearch, setSupSearch] = useState("");

  async function openPicker(importId: string) {
    setPickerFor(importId);
    setSelected(new Set());
    setSupSearch("");
    setSupLoading(true);
    try {
      const res = await clientApi<{ items: SupplierOption[] }>(
        `/suppliers?sourceId=${sourceId}&take=100`,
      );
      setSuppliers(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSupLoading(false);
    }
  }

  function toggle(externalId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  }

  async function runNow(importId: string, supplierExternalIds?: string[]) {
    setError(null);
    setBusy(importId);
    setPickerFor(null);
    try {
      // The run now executes in the background; the POST returns a run id
      // immediately, which we poll for live progress.
      const started = await clientApi<{ runId: string | null }>(
        `/sources/${sourceId}/imports/${importId}/run`,
        {
          method: "POST",
          body: JSON.stringify(
            supplierExternalIds?.length ? { supplierExternalIds } : {},
          ),
        },
      );
      const runId = started.runId;
      if (!runId) {
        router.refresh();
        return;
      }
      // Poll until the run leaves RUNNING. Transient fetch errors are ignored so
      // a brief blip doesn't abort a long import's progress view.
      for (;;) {
        await new Promise((r) => setTimeout(r, 2000));
        let run: SourceImportRun;
        try {
          run = await clientApi<SourceImportRun>(
            `/sources/${sourceId}/imports/${importId}/runs/${runId}`,
          );
        } catch {
          continue;
        }
        setProgress((p) => ({ ...p, [importId]: run }));
        if (run.status !== "RUNNING") break;
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof DemoReadOnlyError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Run failed",
      );
    } finally {
      setBusy(null);
      setProgress((p) => {
        const next = { ...p };
        delete next[importId];
        return next;
      });
    }
  }

  if (imports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--admin-border)] p-10 text-center">
        <p className="text-sm text-[var(--admin-fg)]/70">
          No imports configured for this source yet.
        </p>
        <Link
          href={`/sources/${sourceId}/imports/new`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Create first import
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Format</th>
              <th className="px-4 py-3 text-left font-medium">Schedule</th>
              <th className="px-4 py-3 text-left font-medium">Last run</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {imports.map((imp) => (
              <tr
                key={imp.id}
                className="border-t border-[var(--admin-border)]"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/sources/${sourceId}/imports/${imp.id}`}
                    className="hover:text-[var(--admin-accent)]"
                  >
                    {imp.name}
                  </Link>
                  {!imp.active && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase text-gray-600">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--admin-fg)]/80">
                  {imp.format}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--admin-fg)]/70">
                  {imp.cron || "manual"}
                </td>
                <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                  {imp.lastRunAt ? formatDateTime(imp.lastRunAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  {progress[imp.id]?.status === "RUNNING" ? (
                    <RunProgress run={progress[imp.id]!} />
                  ) : imp.lastStatus ? (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[imp.lastStatus] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {imp.lastStatus}
                    </span>
                  ) : (
                    <span className="text-[var(--admin-fg)]/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy === imp.id}
                      onClick={() => runNow(imp.id)}
                      className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)] disabled:opacity-60"
                    >
                      {busy === imp.id ? "Running…" : "Run now"}
                    </button>
                    <button
                      type="button"
                      disabled={busy === imp.id}
                      onClick={() => openPicker(imp.id)}
                      title="Run the import for selected suppliers only"
                      className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)] disabled:opacity-60"
                    >
                      Run suppliers…
                    </button>
                    <Link
                      href={`/sources/${sourceId}/imports/${imp.id}`}
                      className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)]"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/sources/${sourceId}/imports/${imp.id}/runs`}
                      className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)]"
                    >
                      Runs
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPickerFor(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--admin-border)] px-4 py-3">
              <h3 className="text-sm font-semibold">Run import for suppliers</h3>
              <p className="mt-0.5 text-xs text-[var(--admin-fg)]/60">
                Same background import and report — limited to the products of the
                selected suppliers.
              </p>
              <input
                type="search"
                placeholder="Search suppliers…"
                value={supSearch}
                onChange={(e) => setSupSearch(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--admin-accent)]"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {supLoading ? (
                <p className="px-2 py-4 text-sm text-[var(--admin-fg)]/60">Loading…</p>
              ) : (
                suppliers
                  .filter((s) =>
                    s.name.toLowerCase().includes(supSearch.toLowerCase()),
                  )
                  .map((s) => (
                    <label
                      key={s.externalId}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--admin-muted)]"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.externalId)}
                        onChange={() => toggle(s.externalId)}
                      />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-[var(--admin-fg)]/50">
                        {(s.productLinkCount ?? s.productCount ?? 0).toLocaleString()}
                      </span>
                    </label>
                  ))
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[var(--admin-border)] px-4 py-3">
              <span className="text-xs text-[var(--admin-fg)]/60">
                {selected.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerFor(null)}
                  className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => runNow(pickerFor, [...selected])}
                  className="rounded-md bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Run for {selected.size} supplier{selected.size === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline progress bar for an in-flight run, driven by the polled run row. Shows
 * two phases: downloading details (fetch), then processing/upserting them.
 */
function RunProgress({ run }: { run: SourceImportRun }) {
  const processed = run.created + run.updated + run.skipped + run.failed;
  const total = run.total;

  // No denominator yet → still collecting the id list from the source.
  if (total <= 0) {
    return <ProgressBar label="Collecting…" pct={0} indeterminate />;
  }
  // Processing hasn't started → still downloading detail records.
  if (processed === 0 && run.fetched < total) {
    const pct = Math.min(100, Math.round((run.fetched / total) * 100));
    return (
      <ProgressBar
        label={`Downloading ${run.fetched.toLocaleString()} / ${total.toLocaleString()}`}
        pct={pct}
      />
    );
  }
  // Processing phase.
  const pct = Math.min(100, Math.round((processed / total) * 100));
  return (
    <ProgressBar
      label={`Importing ${processed.toLocaleString()} / ${total.toLocaleString()}`}
      pct={pct}
    />
  );
}

function ProgressBar({
  label,
  pct,
  indeterminate = false,
}: {
  label: string;
  pct: number;
  indeterminate?: boolean;
}) {
  return (
    <div className="min-w-[160px]">
      <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--admin-fg)]/70">
        <span>{label}</span>
        {!indeterminate && <span>{pct}%</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--admin-muted)]">
        <div
          className={`h-full rounded-full bg-[var(--admin-accent)] transition-all duration-500 ${
            indeterminate ? "animate-pulse" : ""
          }`}
          style={{ width: indeterminate ? "100%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}
