import Link from "next/link";
import { type ReactNode } from "react";

interface CategoryCardProps {
  name: string;
  count: number;
  icon: ReactNode;
  slug: string;
}

export function CategoryCard({ name, count, icon, slug }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent)]/30 hover:shadow-md"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-white">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-[var(--foreground)]">{name}</p>
        <p className="text-xs text-[var(--foreground)]/45">{count} products</p>
      </div>
    </Link>
  );
}
