"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

interface PagerProps {
  page: number;
  pageCount: number;
  total: number;
  paramName?: string;
}

export function Pager(props: PagerProps) {
  return (
    <Suspense fallback={<PagerFallback total={props.total} />}>
      <PagerInner {...props} />
    </Suspense>
  );
}

function PagerFallback({ total }: { total: number }) {
  return (
    <div className="mt-4 text-sm text-[var(--admin-fg)]/60">
      {total} result{total === 1 ? "" : "s"}
    </div>
  );
}

function PagerInner({ page, pageCount, total, paramName = "page" }: PagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (pageCount <= 1) {
    return (
      <div className="mt-4 text-sm text-[var(--admin-fg)]/60">
        {total} result{total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-[var(--admin-fg)]/60">
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
