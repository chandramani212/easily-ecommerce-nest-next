"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type JobStatus =
  | "PARSING"
  | "VALIDATING"
  | "VALIDATED"
  | "APPLYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

interface Job {
  id: string;
  status: JobStatus;
  filename: string;
  phase: string;
  total: number;
  processed: number;
  changed: number;
  unchanged: number;
  invalid: number;
  error: string | null;
  report: {
    problems?: { row: number; sku: string; error: string }[];
    problemsTruncated?: boolean;
    newCategories?: {
      l1: string;
      l2: string;
      l3: string;
      createFrom: "L1" | "L2" | "L3";
    }[];
    newCategoriesTruncated?: boolean;
    createdCategories?: number;
    emptyCategories?: number;
  };
}

/** Statuses where work is in flight and the page should keep polling. */
const BUSY: JobStatus[] = ["PARSING", "VALIDATING", "APPLYING"];

const CARD =
  "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5";
const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";
const BTN_PRIMARY =
  "rounded-lg bg-[var(--admin-fg)] px-4 py-2 text-sm font-semibold text-[var(--admin-bg)] transition-opacity hover:opacity-90 disabled:opacity-40";

export function BulkCategoriesClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState<"export" | "upload" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (id: string) => {
    const res = await fetch(`/api/proxy/products/bulk/category-import/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return;
    setJob((await res.json()) as Job);
  }, []);

  // Poll only while something is actually running.
  useEffect(() => {
    if (!job || !BUSY.includes(job.status)) return;
    const id = job.id;
    const timer = setInterval(() => void refresh(id), 700);
    return () => clearInterval(timer);
  }, [job, refresh]);

  // A completed apply changes the catalogue the rest of the admin shows.
  useEffect(() => {
    if (job?.status === "COMPLETED") router.refresh();
  }, [job?.status, router]);

  async function handleExport() {
    setBusy("export");
    setError(null);
    try {
      const res = await fetch("/api/proxy/products/bulk/category-export", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-categories.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(file: File) {
    setBusy("upload");
    setError(null);
    setJob(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/proxy/products/bulk/category-import", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };
      if (!res.ok || !data.id) {
        throw new Error(data.message || `Upload failed (${res.status})`);
      }
      await refresh(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleApply() {
    if (!job) return;
    setBusy("apply");
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/products/bulk/category-import/${job.id}/apply`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message || `Apply failed (${res.status})`);
      }
      await refresh(job.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDiscard() {
    if (!job) return;
    await fetch(`/api/proxy/products/bulk/category-import/${job.id}/cancel`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setJob(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* ---- step 1: export ------------------------------------------- */}
      <section className={CARD}>
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
          1 · Export the current categories
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
          Downloads every product as CSV with its category path. Edit the
          <span className="font-mono"> categoryL1/L2/L3 </span>
          columns and upload it below — the SKU column is what links a row back
          to its product, so leave it alone.
        </p>
        <button
          onClick={handleExport}
          disabled={busy !== null}
          className={`${BTN} mt-4`}
        >
          {busy === "export" ? "Exporting…" : "Export CSV"}
        </button>
      </section>

      {/* ---- step 2: upload ------------------------------------------- */}
      <section className={CARD}>
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
          2 · Upload the edited sheet
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
          The file is checked first. Nothing is written until you confirm.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null || (job !== null && BUSY.includes(job.status))}
          className={`${BTN} mt-4`}
        >
          {busy === "upload" ? "Uploading…" : "Choose CSV file"}
        </button>
      </section>

      {job && <JobPanel job={job} />}

      {job?.status === "VALIDATED" && (
        <section className={CARD}>
          <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
            3 · Apply
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
            {job.changed.toLocaleString()} product
            {job.changed === 1 ? "" : "s"} will have their category changed.
            {(job.report.newCategories?.length ?? 0) > 0 &&
              " Missing categories will be created."}
            {job.invalid > 0 &&
              ` ${job.invalid.toLocaleString()} row${job.invalid === 1 ? "" : "s"} will be skipped — those products keep their current categories.`}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleApply}
              disabled={busy !== null || job.changed === 0}
              className={BTN_PRIMARY}
            >
              {busy === "apply"
                ? "Starting…"
                : job.changed === 0
                  ? "Nothing to apply"
                  : `Apply ${job.changed.toLocaleString()} change${job.changed === 1 ? "" : "s"}`}
            </button>
            <button onClick={handleDiscard} disabled={busy !== null} className={BTN}>
              Discard
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function JobPanel({ job }: { job: Job }) {
  const pct =
    job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;
  const running = BUSY.includes(job.status);

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
          {job.filename}
        </h2>
        <span className="text-xs text-[var(--admin-fg)]/60">
          {job.phase || job.status}
          {job.total > 0 &&
            ` · ${job.processed.toLocaleString()} / ${job.total.toLocaleString()}`}
        </span>
      </div>

      {(running || job.status === "COMPLETED") && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--admin-muted)]">
          <div
            className="h-full rounded-full bg-[var(--admin-fg)] transition-[width] duration-300"
            style={{ width: `${job.status === "COMPLETED" ? 100 : pct}%` }}
          />
        </div>
      )}

      {job.status === "FAILED" && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {job.error ?? "The import failed."}
        </p>
      )}

      {(job.status === "VALIDATED" || job.status === "COMPLETED") && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Rows" value={job.total} />
            <Stat
              label={job.status === "COMPLETED" ? "Changed" : "To change"}
              value={job.changed}
            />
            <Stat label="Already correct" value={job.unchanged} />
            <Stat label="Skipped" value={job.invalid} tone={job.invalid ? "warn" : undefined} />
          </dl>

          {job.status === "COMPLETED" && (
            <p className="mt-4 text-sm text-[var(--admin-fg)]/60">
              {(job.report.createdCategories ?? 0).toLocaleString()} categor
              {job.report.createdCategories === 1 ? "y" : "ies"} created.
              {(job.report.emptyCategories ?? 0) > 0 && (
                <>
                  {" "}
                  {job.report.emptyCategories?.toLocaleString()} categor
                  {job.report.emptyCategories === 1 ? "y holds" : "ies hold"} no
                  products now — hide them from{" "}
                  <a href="/categories" className="underline">
                    Categories
                  </a>{" "}
                  if you don&apos;t want empty tiles on the storefront.
                </>
              )}
            </p>
          )}
        </>
      )}

      {(job.report.newCategories?.length ?? 0) > 0 && (
        <Detail
          title={`Categories that will be created (${job.report.newCategories!.length}${job.report.newCategoriesTruncated ? "+" : ""})`}
        >
          <ul className="space-y-1">
            {job.report.newCategories!.map((c, i) => (
              <li key={i} className="font-mono text-xs">
                {c.l1} › {c.l2} › {c.l3}
                <span className="ml-2 font-sans text-[var(--admin-fg)]/50">
                  new from {c.createFrom}
                </span>
              </li>
            ))}
          </ul>
        </Detail>
      )}

      {(job.report.problems?.length ?? 0) > 0 && (
        <Detail
          title={`Rows that will be skipped (${job.report.problems!.length}${job.report.problemsTruncated ? "+" : ""})`}
        >
          <table className="w-full text-xs">
            <thead className="text-left text-[var(--admin-fg)]/50">
              <tr>
                <th className="pb-1 pr-4 font-medium">Row</th>
                <th className="pb-1 pr-4 font-medium">SKU</th>
                <th className="pb-1 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {job.report.problems!.map((p, i) => (
                <tr key={i}>
                  <td className="pr-4 font-mono">{p.row}</td>
                  <td className="pr-4 font-mono">{p.sku || "—"}</td>
                  <td>{p.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Detail>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <div>
      <dt className="text-xs text-[var(--admin-fg)]/50">{label}</dt>
      <dd
        className={`text-lg font-semibold ${tone === "warn" ? "text-amber-500" : "text-[var(--admin-fg)]"}`}
      >
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function Detail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="mt-4 rounded-lg border border-[var(--admin-border)] p-3">
      <summary className="cursor-pointer text-sm font-medium text-[var(--admin-fg)]">
        {title}
      </summary>
      <div className="mt-3 max-h-72 overflow-auto">{children}</div>
    </details>
  );
}
