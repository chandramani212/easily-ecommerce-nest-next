"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  const pages = buildPageRange(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg p-2 text-[var(--foreground)]/50 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-sm text-[var(--foreground)]/30">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`h-9 min-w-[36px] rounded-lg px-2.5 text-sm font-medium transition-colors ${
              currentPage === p
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--foreground)]/60 hover:bg-[var(--muted)]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg p-2 text-[var(--foreground)]/50 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  );
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
