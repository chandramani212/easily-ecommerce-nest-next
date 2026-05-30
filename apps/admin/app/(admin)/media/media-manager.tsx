"use client";

import { useCallback, useRef, useState } from "react";

import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import { IS_DEMO } from "../../../lib/demo";
import type { MediaAsset, Pagination } from "../../../lib/types";

interface Props {
  initial: Pagination<MediaAsset>;
  initialQuery: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function MediaManager({ initial, initialQuery }: Props) {
  const [items, setItems] = useState<MediaAsset[]>(initial.items);
  const [search, setSearch] = useState(initialQuery);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async (q: string) => {
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: "60" });
      if (q) params.set("q", q);
      const data = await clientApi<Pagination<MediaAsset>>(
        `/media?${params.toString()}`,
      );
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    }
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    setInfo(null);
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const asset = await clientApi<MediaAsset>(`/media`, {
          method: "POST",
          body: fd,
        });
        setItems((prev) => [asset, ...prev]);
      }
      setInfo(`${list.length} file${list.length === 1 ? "" : "s"} uploaded.`);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode — uploads are disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function cleanupOrphans() {
    if (
      !window.confirm(
        "Delete every media asset not currently referenced by any product? Files are removed from disk too. This cannot be undone.",
      )
    )
      return;
    setCleaning(true);
    setError(null);
    setInfo(null);
    try {
      const res = await clientApi<{
        deleted: number;
        fileFailures: number;
        sample: string[];
      }>(`/media/cleanup-orphans`, { method: "POST" });
      setInfo(
        res.deleted === 0
          ? "No orphan media assets found."
          : `Removed ${res.deleted} orphan asset${res.deleted === 1 ? "" : "s"}` +
              (res.fileFailures
                ? ` (${res.fileFailures} file${res.fileFailures === 1 ? "" : "s"} missing from disk — DB rows cleaned).`
                : "."),
      );
      void refresh(search);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode — cleanup is disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Cleanup failed");
      }
    } finally {
      setCleaning(false);
    }
  }

  async function deleteAsset(asset: MediaAsset) {
    if (
      !window.confirm(
        `Delete "${asset.originalName}"? This cannot be undone.`,
      )
    )
      return;
    setError(null);
    try {
      await clientApi(`/media/${asset.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((m) => m.id !== asset.id));
      if (selected?.id === asset.id) setSelected(null);
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode — deletion is disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setInfo("URL copied to clipboard.");
      setTimeout(() => setInfo(null), 1500);
    } catch {
      setError("Couldn't copy URL.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div
        className={`rounded-xl border bg-[var(--admin-card)] ${
          dragActive
            ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30"
            : "border-[var(--admin-border)]"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) {
            void uploadFiles(e.dataTransfer.files);
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] p-3">
          <input
            type="text"
            placeholder="Search by filename or alt text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void refresh(search);
              }
            }}
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <button
            type="button"
            onClick={() => void refresh(search)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
          >
            Search
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={cleaning || IS_DEMO}
            onClick={() => void cleanupOrphans()}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--admin-muted)] disabled:opacity-50"
            title={
              IS_DEMO
                ? "Cleanup disabled in demo"
                : "Remove media assets not referenced by any product"
            }
          >
            {cleaning ? "Cleaning…" : "Cleanup orphans"}
          </button>
          <button
            type="button"
            disabled={uploading || IS_DEMO}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            title={IS_DEMO ? "Uploads disabled in demo" : "Upload from your device"}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {(error || info) && (
          <div
            className={`border-b px-4 py-2 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ?? info}
          </div>
        )}

        <div className="p-4">
          {items.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--admin-border)] p-12 text-center">
              <p className="text-sm font-semibold text-[var(--admin-fg)]/70">
                No media yet.
              </p>
              <p className="mt-1 text-xs text-[var(--admin-fg)]/50">
                Drag &amp; drop files anywhere on this card, or click Upload above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {items.map((a) => {
                const isSel = selected?.id === a.id;
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 text-left transition-all ${
                      isSel
                        ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/30"
                        : "border-[var(--admin-border)] hover:border-[var(--admin-fg)]/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.alt ?? a.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[11px] font-medium text-white">
                        {a.originalName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        {selected ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-[var(--admin-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.url}
                alt={selected.alt ?? selected.originalName}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div>
              <h4 className="break-words font-semibold">
                {selected.originalName}
              </h4>
              <p className="mt-1 break-all font-mono text-xs text-[var(--admin-fg)]/60">
                {selected.filename}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-[var(--admin-fg)]/60">Type</dt>
              <dd className="font-medium">{selected.mimeType}</dd>
              <dt className="text-[var(--admin-fg)]/60">Size</dt>
              <dd className="font-medium">{formatBytes(selected.size)}</dd>
              {selected.width && selected.height && (
                <>
                  <dt className="text-[var(--admin-fg)]/60">Dimensions</dt>
                  <dd className="font-medium">
                    {selected.width} × {selected.height}
                  </dd>
                </>
              )}
              <dt className="text-[var(--admin-fg)]/60">Uploaded</dt>
              <dd className="font-medium">
                {new Date(selected.createdAt).toLocaleDateString()}
              </dd>
            </dl>

            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--admin-fg)]/60">
                Public URL
              </p>
              <div className="flex items-stretch gap-1.5">
                <input
                  readOnly
                  value={selected.url}
                  className="flex-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1.5 font-mono text-[11px] outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => void copyUrl(selected.url)}
                  className="rounded-md border border-[var(--admin-border)] px-2.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
                  title="Copy URL"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void deleteAsset(selected)}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-[var(--admin-fg)]/70">
              Select an item
            </p>
            <p className="mt-1 text-xs text-[var(--admin-fg)]/50">
              Click a thumbnail to see its details.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
