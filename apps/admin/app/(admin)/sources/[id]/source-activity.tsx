import Link from "next/link";

import { formatDateTime } from "../../../../lib/format";
import type { SourceImportRun } from "../../../../lib/types";

const STATUS_BADGE: Record<string, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

export function SourceActivity({
  sourceId,
  runs,
}: {
  sourceId: string;
  runs: SourceImportRun[];
}) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--admin-border)] p-10 text-center">
        <p className="text-sm text-[var(--admin-fg)]/70">
          No runs yet. Trigger one from the Imports tab to see activity here.
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
          {runs.map((run) => (
            <tr key={run.id} className="border-t border-[var(--admin-border)]">
              <td className="px-4 py-3 text-[var(--admin-fg)]/80">
                {formatDateTime(run.startedAt)}
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
                <Link
                  href={`/sources/${sourceId}/imports/${run.importId}/runs`}
                  className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
