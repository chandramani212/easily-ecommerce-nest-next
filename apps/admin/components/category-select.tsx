"use client";

import { useEffect, useRef, useState } from "react";

import type { Category } from "../lib/types";
import { buildCategoryTree } from "../lib/category-tree";

/**
 * Build a name→count map across the pool so the renderer can decide which
 * entries need a "(under <parent>)" suffix to disambiguate. We only add the
 * suffix for names that occur more than once — keeps unique names clean.
 */
function nameCollisions(categories: Category[]): Set<string> {
  const counts = new Map<string, number>();
  for (const c of categories) {
    const key = c.name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const collisions = new Set<string>();
  for (const [name, n] of counts) if (n > 1) collisions.add(name);
  return collisions;
}

function parentNameFor(cat: Category, all: Category[]): string | null {
  if (cat.parent?.name) return cat.parent.name;
  if (!cat.parentId) return null;
  return all.find((c) => c.id === cat.parentId)?.name ?? null;
}

/** Render label that adds "(under <parent>)" when the bare name is ambiguous. */
export function categoryLabel(
  cat: Category,
  all: Category[],
  collisions = nameCollisions(all),
): string {
  const key = cat.name.trim().toLowerCase();
  if (!collisions.has(key)) return cat.name;
  const parentName = parentNameFor(cat, all);
  return parentName ? `${cat.name} (under ${parentName})` : `${cat.name} (top-level)`;
}

export function CategorySelect({
  value,
  onChange,
  categories,
  excludeId,
  placeholder = "No parent (top-level)",
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  categories: Category[];
  excludeId?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);
  const tree = buildCategoryTree(categories, excludeId);
  const collisions = nameCollisions(categories);
  const selected = categories.find((c) => c.id === value);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? tree.filter((t) =>
        categoryLabel(t.category, categories, collisions)
          .toLowerCase()
          .includes(q),
      )
    : tree;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Force-close the menu if we get disabled mid-interaction (e.g. during a save).
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  // On open: reset the search, focus it, and scroll the list so the currently
  // mapped category is centered (rather than always starting at the top). We
  // adjust the list's own scrollTop so the page never scrolls.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const raf = requestAnimationFrame(() => {
      const li = selectedRef.current;
      const list = listRef.current;
      if (li && list) {
        const liRect = li.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        list.scrollTop +=
          liRect.top - listRect.top - (listRect.height - liRect.height) / 2;
      }
      searchRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "" : "text-[var(--admin-fg)]/40"}>
          {selected ? categoryLabel(selected, categories, collisions) : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-40">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-lg">
          <div className="border-b border-[var(--admin-border)] p-1.5">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder="Search categories…"
              className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--admin-accent)]"
            />
          </div>
          <ul ref={listRef} className="max-h-56 overflow-y-auto divide-y divide-[var(--admin-border)]">
            {!q && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--admin-muted)] ${!value ? "bg-[var(--admin-accent)]/5 font-medium" : "text-[var(--admin-fg)]/50"}`}
                >
                  {placeholder}
                </button>
              </li>
            )}
            {filtered.map(({ category: c, depth }) => (
              <li key={c.id} ref={value === c.id ? selectedRef : undefined}>
                <button
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className={`flex w-full items-center gap-1 py-2 pr-3 text-left text-sm hover:bg-[var(--admin-muted)] ${value === c.id ? "bg-[var(--admin-accent)]/5 font-medium" : ""}`}
                  style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
                >
                  {depth > 0 && <span className="text-[var(--admin-fg)]/30">↳</span>}
                  {categoryLabel(c, categories, collisions)}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-[var(--admin-fg)]/50">
                No matching categories
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
