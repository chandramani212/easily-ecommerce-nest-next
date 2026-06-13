"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clientApi,
  DemoReadOnlyError,
} from "../../../../lib/client-api";
import { formatDateTime } from "../../../../lib/format";
import type { SourceImportSummary } from "../../../../lib/types";

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

  async function runNow(importId: string) {
    setError(null);
    setBusy(importId);
    try {
      await clientApi(`/sources/${sourceId}/imports/${importId}/run`, {
        method: "POST",
        body: JSON.stringify({}),
      });
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
                  {imp.lastStatus ? (
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
    </div>
  );
}
