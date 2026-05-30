"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { IS_DEMO } from "../lib/demo";

interface ExportButtonProps {
  /** API resource path to export, e.g. "/customers/export". */
  path: string;
  /** Search param names that act as filters and should be forwarded. */
  filterParams: string[];
  label?: string;
}

export function ExportButton(props: ExportButtonProps) {
  return (
    <Suspense fallback={<ExportButtonShell label={props.label} />}>
      <ExportButtonInner {...props} />
    </Suspense>
  );
}

function ExportButtonShell({
  label = "Export CSV",
  disabled = true,
  busy = false,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm font-medium text-[var(--admin-fg)] transition-colors hover:border-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      {busy ? "Exporting…" : label}
    </button>
  );
}

function ExportButtonInner({
  path,
  filterParams,
  label = "Export CSV",
}: ExportButtonProps) {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const params = new URLSearchParams();
      for (const key of filterParams) {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
      const query = params.toString();
      const res = await fetch(
        `/api/proxy${path}${query ? `?${query}` : ""}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const filename =
        parseFilename(res.headers.get("content-disposition")) ?? "export.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  if (IS_DEMO) {
    return <ExportButtonShell label={label} disabled />;
  }

  return (
    <ExportButtonShell
      label={label}
      disabled={busy}
      busy={busy}
      onClick={download}
    />
  );
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match?.[1] ?? null;
}
