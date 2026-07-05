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
  const ref = useRef<HTMLDivElement>(null);
  const tree = buildCategoryTree(categories, excludeId);
  const collisions = nameCollisions(categories);
  const selected = categories.find((c) => c.id === value);

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
          <ul className="max-h-56 overflow-y-auto divide-y divide-[var(--admin-border)]">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--admin-muted)] ${!value ? "bg-[var(--admin-accent)]/5 font-medium" : "text-[var(--admin-fg)]/50"}`}
              >
                {placeholder}
              </button>
            </li>
            {tree.map(({ category: c, depth }) => (
              <li key={c.id}>
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
          </ul>
        </div>
      )}
    </div>
  );
}
