"use client";

import { useState } from "react";
import { Tabs } from "@repo/ui/tabs";

const TAB_ITEMS = [
  { key: "daily", label: "Daily Sales" },
  { key: "online", label: "Online Sales" },
  { key: "users", label: "New Users" },
];

const TAB_DATA: Record<string, { digital: number; physical: number }> = {
  daily: { digital: 790, physical: 572 },
  online: { digital: 1250, physical: 830 },
  users: { digital: 340, physical: 215 },
};

export function ProductPerformance() {
  const [tab, setTab] = useState("daily");
  const data = TAB_DATA[tab] ?? TAB_DATA.daily!;

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">Product Performance</h3>
        <button className="rounded p-1 text-[var(--admin-fg)]/30 hover:bg-[var(--admin-muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mt-4">
        <Tabs items={TAB_ITEMS} activeTab={tab} onChange={setTab} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-[var(--admin-muted)] p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <p className="text-xs text-[var(--admin-fg)]/50">Digital Product</p>
          <p className="mt-1 text-2xl font-bold">{data.digital.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-[var(--admin-muted)] p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-180 text-rose-500">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <p className="text-xs text-[var(--admin-fg)]/50">Physical Product</p>
          <p className="mt-1 text-2xl font-bold">{data.physical.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--admin-border)] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--admin-fg)]/50">Average Daily Sales</p>
          <span className="text-xs text-red-500">-0.52%</span>
        </div>
        <p className="mt-1 text-2xl font-bold">$2,950</p>
      </div>
    </div>
  );
}
