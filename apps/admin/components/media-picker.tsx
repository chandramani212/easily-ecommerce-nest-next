"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { clientApi, DemoReadOnlyError } from "../lib/client-api";
import { IS_DEMO } from "../lib/demo";
import type { MediaAsset, Pagination } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  multiple?: boolean;
  initialSelected?: string[];
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  initialSelected = [],
}: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: "60" });
      if (q) params.set("q", q);
      const data = await clientApi<Pagination<MediaAsset>>(
        `/media?${params.toString()}`,
      );
      setAssets(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(new Set(initialSelected));
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiple) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!files || (files as FileList).length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const list = Array.from(files);
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const asset = await clientApi<MediaAsset>(`/media`, {
          method: "POST",
          body: fd,
        });
        setAssets((prev) => [asset, ...prev]);
      }
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode \u2014 uploads are disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  function handleConfirm() {
    const chosen = assets.filter((a) => selected.has(a.id));
    onSelect(chosen);
    onClose();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[var(--admin-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
          <h3 className="text-base font-semibold">
            {multiple ? "Select images" : "Select image"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--admin-fg)]/60 hover:bg-[var(--admin-muted)] hover:text-[var(--admin-fg)]"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-5 py-3">
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void load(search);
              }
            }}
            className="flex-1 min-w-[180px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <button
            type="button"
            onClick={() => void load(search)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
          >
            Search
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading || IS_DEMO}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            title={IS_DEMO ? "Uploads disabled in demo" : "Upload from your device"}
          >
            {uploading ? "Uploading\u2026" : "Upload"}
          </button>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto p-5"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDrop}
        >
          {loading ? (
            <p className="text-sm text-[var(--admin-fg)]/60">Loading…</p>
          ) : assets.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--admin-border)] p-10 text-center">
              <p className="text-sm font-medium text-[var(--admin-fg)]/70">
                No media yet.
              </p>
              <p className="mt-1 text-xs text-[var(--admin-fg)]/50">
                Drag &amp; drop files here, or click Upload above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {assets.map((a) => {
                const isSel = selected.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      isSel
                        ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30"
                        : "border-[var(--admin-border)] hover:border-[var(--admin-fg)]/30"
                    }`}
                  >
                    <img
                      src={a.url}
                      alt={a.alt ?? a.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSel && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-accent)] text-white">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[10px] font-medium text-white">
                        {a.originalName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-5 py-3">
          <p className="text-xs text-[var(--admin-fg)]/60">
            {selected.size} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Insert {multiple ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
