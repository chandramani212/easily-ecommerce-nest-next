"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface StatusFilterProps {
  statuses: string[];
  selected?: string;
  paramName?: string;
  label?: string;
}

export function StatusFilter(props: StatusFilterProps) {
  return (
    <Suspense
      fallback={
        <select
          disabled
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none"
        >
          <option>{props.label ?? "All statuses"}</option>
        </select>
      }
    >
      <StatusFilterInner {...props} />
    </Suspense>
  );
}

function StatusFilterInner({
  statuses,
  selected,
  paramName = "status",
  label = "All statuses",
}: StatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramName, value);
    else params.delete(paramName);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
    >
      <option value="">{label}</option>
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
