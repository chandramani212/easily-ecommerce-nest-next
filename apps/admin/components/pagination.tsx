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

/**
 * Page numbers to render: always first and last, plus a window around the
 * current page, with "…" standing in for the gaps. Keeps the control a fixed
 * width even when an import has left a list thousands of pages long.
 */
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  // Size of the contiguous run of pages around the current one. First and last
  // are added on top of this, so 8-11 numbered buttons are on screen.
  const WINDOW = 9;

  // Slide the window so it stays full at both ends (page 1 shows 1-9, the last
  // page shows the final nine) instead of shrinking to half a window.
  const half = Math.floor(WINDOW / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(pageCount, start + WINDOW - 1);
  start = Math.max(1, end - WINDOW + 1);

  const wanted = new Set<number>([1, pageCount]);
  for (let n = start; n <= end; n += 1) wanted.add(n);

  const sorted = [...wanted]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const n of sorted) {
    if (previous && n - previous > 1) items.push("gap");
    items.push(n);
    previous = n;
  }
  return items;
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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-[var(--admin-fg)]/60">
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-40"
        >
          Previous
        </button>
        {pageItems(page, pageCount).map((item, i) =>
          item === "gap" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-[var(--admin-fg)]/40"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => go(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Page ${item}`}
              className={`min-w-[2rem] rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                item === page
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] font-semibold text-white"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-muted)]"
              }`}
            >
              {item}
            </button>
          ),
        )}
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
