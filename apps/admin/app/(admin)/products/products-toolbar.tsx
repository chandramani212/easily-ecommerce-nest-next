"use client";

import Link from "next/link";
import { useState } from "react";

import { ExportPanel } from "./bulk/export-panel";

const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";

/**
 * Export opens a field picker and streams straight from the API. Import needs
 * a validation step and a progress bar, so it lives on its own page.
 */
export function ProductsToolbar() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Link href="/products/bulk" className={BTN}>
        Import CSV
      </Link>
      <button onClick={() => setExportOpen(true)} className={BTN}>
        Export CSV
      </button>

      {exportOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setExportOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--admin-card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Export products</h3>
              <button
                onClick={() => setExportOpen(false)}
                className="rounded-md p-1.5 text-[var(--admin-fg)]/60 hover:bg-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ExportPanel />
          </div>
        </div>
      )}
    </div>
  );
}
