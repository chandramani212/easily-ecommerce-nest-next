"use client";

import { useState } from "react";

import { MediaPicker } from "./media-picker";

/**
 * Single-image picker bound to a URL string. Shows a preview + buttons to
 * choose from the media library or clear. Reused by page/product editors.
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <span className="text-xs font-medium text-[var(--admin-fg)]/70">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-[var(--admin-fg)]/40">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
            >
              {value ? "Change image" : "Choose image"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-md border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Clear
              </button>
            )}
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="or paste an image URL / path"
            className="w-72 max-w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-xs outline-none focus:border-[var(--admin-accent)]"
          />
        </div>
      </div>
      {hint && <p className="text-[11px] text-[var(--admin-fg)]/50">{hint}</p>}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(assets) => {
          if (assets[0]) onChange(assets[0].url);
          setOpen(false);
        }}
      />
    </div>
  );
}
