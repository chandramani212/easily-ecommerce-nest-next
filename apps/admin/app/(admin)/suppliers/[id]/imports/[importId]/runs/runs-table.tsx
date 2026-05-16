"use client";

import React, { useState } from "react";

import { formatDateTime } from "../../../../../../../lib/format";
import type { SupplierImportRun } from "../../../../../../../lib/types";

const STATUS_BADGE: Record<string, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

export function RunsTable({ runs }: { runs: SupplierImportRun[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function downloadErrors(run: SupplierImportRun) {
    const rows = [
      ["record", "externalId", "error"],
      ...run.errors.map((e) => [
        String(e.record),
        e.externalId ?? "",
        sanitize(e.error),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((cell) =>
            /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
          )
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-${run.id}-errors.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--admin-border)] p-10 text-center">
        <p className="text-sm text-[var(--admin-fg)]/70">
          No runs yet. Trigger one from the import editor or wait for the
          schedule to fire.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Started</th>
            <th className="px-4 py-3 text-left font-medium">Duration</th>
            <th className="px-4 py-3 text-left font-medium">Trigger</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Created</th>
            <th className="px-4 py-3 text-right font-medium">Updated</th>
            <th className="px-4 py-3 text-right font-medium">Skipped</th>
            <th className="px-4 py-3 text-right font-medium">Failed</th>
            <th className="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const expanded = expandedId === run.id;
            const duration = run.finishedAt
              ? `${Math.round(
                  (new Date(run.finishedAt).getTime() -
                    new Date(run.startedAt).getTime()) /
                    100,
                ) / 10}s`
              : "—";
            return (
              <React.Fragment key={run.id}>
                <tr className="border-t border-[var(--admin-border)]">
                  <td className="px-4 py-3 text-[var(--admin-fg)]/80">
                    {formatDateTime(run.startedAt)}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                    {duration}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                    {run.triggeredBy === "SCHEDULE" ? "Scheduled" : "Manual"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[run.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{run.created}</td>
                  <td className="px-4 py-3 text-right">{run.updated}</td>
                  <td className="px-4 py-3 text-right">{run.skipped}</td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {run.failed}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {run.errors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => downloadErrors(run)}
                          className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs hover:bg-[var(--admin-muted)]"
                        >
                          Errors CSV
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : run.id)
                        }
                        className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs hover:bg-[var(--admin-muted)]"
                      >
                        {expanded ? "Hide" : "Details"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-t border-[var(--admin-border)] bg-[var(--admin-muted)]/30">
                    <td colSpan={9} className="px-4 py-3 text-xs">
                      {run.errors.length === 0 ? (
                        <p className="text-[var(--admin-fg)]/60">
                          No errors recorded for this run.
                        </p>
                      ) : (
                        <div className="max-h-72 overflow-auto rounded border border-[var(--admin-border)] bg-[var(--admin-card)]">
                          <table className="w-full text-xs">
                            <thead className="bg-[var(--admin-muted)]/60">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">
                                  #
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                  External ID
                                </th>
                                <th className="px-3 py-2 text-left font-medium">
                                  Error
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {run.errors.map((e, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-[var(--admin-border)]"
                                >
                                  <td className="px-3 py-2 text-[var(--admin-fg)]/70">
                                    {e.record}
                                  </td>
                                  <td className="px-3 py-2 font-mono">
                                    {e.externalId ?? "—"}
                                  </td>
                                  <td className="px-3 py-2 text-red-600">
                                    {e.error}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function sanitize(s: string): string {
  return s.replace(/\r?\n/g, " ").trim();
}
