"use client";

import { useCallback, useEffect, useState } from "react";

import { clientApi } from "../lib/client-api";
import type { Pagination, Product } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  excludeIds?: string[];
  initialSelected?: string[];
}

export function ProductPicker({
  open,
  onClose,
  onSelect,
  excludeIds = [],
  initialSelected = [],
}: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "30" });
      if (q) params.set("q", q);
      const data = await clientApi<Pagination<Product>>(
        `/products?${params.toString()}`,
      );
      setItems(data.items);
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
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    const chosen = items.filter((p) => selected.has(p.id));
    onSelect(chosen);
    onClose();
  }

  if (!open) return null;

  const visible = items.filter((p) => !excludeIds.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--admin-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
          <h3 className="text-base font-semibold">Add related products</h3>
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

        <div className="border-b border-[var(--admin-border)] px-5 py-3">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void load(search);
              }
            }}
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="px-2 py-3 text-sm text-[var(--admin-fg)]/60">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[var(--admin-fg)]/60">
              No products found.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {visible.map((p) => {
                const isSel = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm hover:bg-[var(--admin-muted)] ${
                        isSel ? "bg-[var(--admin-accent)]/5" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        readOnly
                        className="h-4 w-4"
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--admin-muted)]">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-[var(--admin-fg)]/40">
                            —
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate font-mono text-xs text-[var(--admin-fg)]/60">
                          {p.sku}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
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
              onClick={confirm}
              disabled={selected.size === 0}
              className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Add ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
