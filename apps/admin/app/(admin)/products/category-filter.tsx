"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import type { Category } from "../../../lib/types";

interface CategoryFilterProps {
  categories: Category[];
  selected?: string;
}

export function CategoryFilter(props: CategoryFilterProps) {
  return (
    <Suspense
      fallback={
        <select
          disabled
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm outline-none"
        >
          <option>All categories</option>
        </select>
      }
    >
      <CategoryFilterInner {...props} />
    </Suspense>
  );
}

function CategoryFilterInner({ categories, selected }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("categoryId", value);
    else params.delete("categoryId");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={selected ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
