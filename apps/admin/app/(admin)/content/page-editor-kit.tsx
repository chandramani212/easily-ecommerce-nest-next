"use client";

import type { ReactNode } from "react";

const inputCls =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

export function EditorSection({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[var(--admin-fg)]/70">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[var(--admin-fg)]/70">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={inputCls}
      />
    </label>
  );
}

/** Generic repeating-list editor: add / remove / reorder rows of any shape. */
export function ListEditor<T>({
  title,
  items,
  onChange,
  empty,
  addLabel,
  renderRow,
}: {
  title: string;
  items: T[];
  onChange: (next: T[]) => void;
  empty: T;
  addLabel: string;
  renderRow: (item: T, patch: (p: Partial<T>) => void) => ReactNode;
}) {
  const patchAt = (i: number, p: Partial<T>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-fg)]/50">
        {title}
      </p>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--admin-border)] p-3"
        >
          <div className="mb-2 flex justify-end gap-1">
            <button
              type="button"
              onClick={() => onChange(moveItem(items, i, -1))}
              disabled={i === 0}
              className="rounded border border-[var(--admin-border)] px-2 text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onChange(moveItem(items, i, 1))}
              disabled={i === items.length - 1}
              className="rounded border border-[var(--admin-border)] px-2 text-xs disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="rounded border border-[var(--admin-border)] px-2 text-xs text-red-600"
            >
              ✕
            </button>
          </div>
          {renderRow(item, (p) => patchAt(i, p))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { ...empty }])}
        className="text-sm font-medium text-[var(--admin-accent)]"
      >
        {addLabel}
      </button>
    </div>
  );
}

export function SaveBar({
  saving,
  saved,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
    </div>
  );
}

export function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  const tmp = next[i]!;
  next[i] = next[j]!;
  next[j] = tmp;
  return next;
}
