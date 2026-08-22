"use client";

import Link from "next/link";
import { useState } from "react";

const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";

/**
 * Export streams straight from the API, so it stays a plain download here.
 * Import needs a validation step and a progress bar, so it lives on its own
 * page rather than behind a file picker in the toolbar.
 */
export function ProductsToolbar() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setMessage(null);
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
      setMessage(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/products/bulk-categories" className={BTN}>
        Import CSV
      </Link>
      <button onClick={handleExport} disabled={busy} className={BTN}>
        {busy ? "Exporting…" : "Export CSV"}
      </button>
      {message && (
        <span className="text-xs text-[var(--admin-fg)]/60">{message}</span>
      )}
    </div>
  );
}
