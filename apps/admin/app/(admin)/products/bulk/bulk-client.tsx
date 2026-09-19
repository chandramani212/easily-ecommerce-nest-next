"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ExportPanel } from "./export-panel";

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
    toCreate?: number;
    toUpdate?: number;
    columns?: string[];
    ignoredColumns?: string[];
    created?: number;
    updated?: number;
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

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

export function BulkClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState<"upload" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (id: string) => {
    const res = await fetch(`/api/proxy/products/bulk/import/${id}`, {
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

  async function handleUpload(file: File) {
    setBusy("upload");
    setError(null);
    setJob(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/proxy/products/bulk/import", {
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
      const res = await fetch(`/api/proxy/products/bulk/import/${job.id}/apply`, {
        method: "POST",
        credentials: "include",
      });
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
    await fetch(`/api/proxy/products/bulk/import/${job.id}/cancel`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
    setJob(null);
  }

  const toCreate = job?.report.toCreate ?? 0;
  const toUpdate = job?.report.toUpdate ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <section className={CARD}>
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
          1 · Export products
        </h2>
        <div className="mt-3">
          <ExportPanel />
        </div>
      </section>

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
        <FormatGuide />
      </section>

      {job && <JobPanel job={job} />}

      {job?.status === "VALIDATED" && (
        <section className={CARD}>
          <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
            3 · Apply
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
            {plural(toUpdate, "product")} will be updated
            {toCreate > 0 && ` and ${plural(toCreate, "new product")} created`}.
            {job.invalid > 0 &&
              ` ${plural(job.invalid, "row")} with errors will be skipped — those products stay as they are.`}
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
                  : `Apply ${plural(job.changed, "change")}`}
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

function FormatGuide() {
  return (
    <details className="mt-4 rounded-lg border border-[var(--admin-border)] p-3 text-sm">
      <summary className="cursor-pointer font-medium text-[var(--admin-fg)]">
        How the sheet is read
      </summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--admin-fg)]/70">
        <li>
          Rows are matched on <b>sku</b>. A SKU that doesn&apos;t exist creates a
          new product (needs <b>name</b> and <b>sellingPrice</b>).
        </li>
        <li>
          Only the columns in the file are touched, and a <b>blank cell means
          &ldquo;no change&rdquo;</b>. To empty an optional field, type{" "}
          <code>CLEAR</code>.
        </li>
        <li>
          Quantity prices: <code>tier1Qty</code>/<code>tier1Price</code>,{" "}
          <code>tier2Qty</code>/<code>tier2Price</code>… The tiers in a row
          replace all of that product&apos;s tiers. A price like <code>10%</code>{" "}
          is a discount off the selling price. Put <code>CLEAR</code> in{" "}
          <code>tier1Qty</code> to remove every tier.
        </li>
        <li>
          Lists use <code>|</code>: related SKUs and <code>attributes</code>{" "}
          (<code>Color=Red|Material=Steel</code>).
        </li>
        <li>
          <code>categoryL1/L2/L3</code> set the product&apos;s main category and
          must already exist. Its other categories (e.g. Best Sellers) are kept
          — manage those from the category page.
        </li>
        <li>
          <code>active</code> is <code>true</code> or <code>false</code>. Extra
          columns the importer doesn&apos;t know are ignored. Product images,
          supplier SKU and source categories are never changed — edit images in the product
          editor.
        </li>
      </ul>
    </details>
  );
}

function JobPanel({ job }: { job: Job }) {
  const pct =
    job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;
  const running = BUSY.includes(job.status);
  const done = job.status === "COMPLETED";
  const r = job.report;

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]">{job.filename}</h2>
        <span className="text-xs text-[var(--admin-fg)]/60">
          {job.phase || job.status}
          {job.total > 0 &&
            ` · ${job.processed.toLocaleString()} / ${job.total.toLocaleString()}`}
        </span>
      </div>

      {(running || done) && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--admin-muted)]">
          <div
            className="h-full rounded-full bg-[var(--admin-fg)] transition-[width] duration-300"
            style={{ width: `${done ? 100 : pct}%` }}
          />
        </div>
      )}

      {job.status === "FAILED" && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {job.error ?? "The import failed."}
        </p>
      )}

      {(job.status === "VALIDATED" || done) && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Rows" value={job.total} />
            <Stat label={done ? "Updated" : "To update"} value={done ? (r.updated ?? 0) : (r.toUpdate ?? 0)} />
            <Stat label={done ? "Created" : "To create"} value={done ? (r.created ?? 0) : (r.toCreate ?? 0)} />
            <Stat label="Unchanged" value={job.unchanged} />
            <Stat label="Skipped" value={job.invalid} tone={job.invalid ? "warn" : undefined} />
          </dl>
          {(r.columns?.length ?? 0) > 0 && (
            <p className="mt-3 text-xs text-[var(--admin-fg)]/50">
              Columns read: <span className="font-mono">{r.columns!.join(", ")}</span>
              {(r.ignoredColumns?.length ?? 0) > 0 && (
                <>
                  {" "}· ignored:{" "}
                  <span className="font-mono">{r.ignoredColumns!.join(", ")}</span>
                </>
              )}
            </p>
          )}
        </>
      )}

      {(r.problems?.length ?? 0) > 0 && (
        <details className="mt-4 rounded-lg border border-[var(--admin-border)] p-3" open={!done}>
          <summary className="cursor-pointer text-sm font-medium text-[var(--admin-fg)]">
            Rows that will be skipped ({r.problems!.length}
            {r.problemsTruncated ? "+" : ""})
          </summary>
          <div className="mt-3 max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--admin-fg)]/50">
                <tr>
                  <th className="pb-1 pr-4 font-medium">Row</th>
                  <th className="pb-1 pr-4 font-medium">SKU</th>
                  <th className="pb-1 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {r.problems!.map((p, i) => (
                  <tr key={i} className="align-top">
                    <td className="pr-4 font-mono">{p.row}</td>
                    <td className="pr-4 font-mono">{p.sku || "—"}</td>
                    <td className="pb-1">{p.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
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
