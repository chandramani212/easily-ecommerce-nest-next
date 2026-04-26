"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface DateRangeFilterProps {
  fromParam?: string;
  toParam?: string;
}

export function DateRangeFilter(props: DateRangeFilterProps) {
  return (
    <Suspense fallback={<DateRangeFallback />}>
      <DateRangeFilterInner {...props} />
    </Suspense>
  );
}

function DateRangeFallback() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        disabled
        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none"
      />
      <span className="text-[var(--admin-fg)]/50">to</span>
      <input
        type="date"
        disabled
        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function DateRangeFilterInner({
  fromParam = "dateFrom",
  toParam = "dateTo",
}: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = searchParams.get(fromParam) ?? "";
  const to = searchParams.get(toParam) ?? "";

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        value={from}
        onChange={(e) => update(fromParam, e.target.value)}
        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
      />
      <span className="text-[var(--admin-fg)]/50">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => update(toParam, e.target.value)}
        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
      />
    </div>
  );
}
