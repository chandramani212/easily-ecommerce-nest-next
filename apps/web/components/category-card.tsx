import { type ReactNode } from "react";

interface CategoryCardProps {
  name: string;
  count: number;
  icon: ReactNode;
}

export function CategoryCard({ name, count, icon }: CategoryCardProps) {
  return (
    <a
      href="#"
      className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-center transition-all hover:-translate-y-1 hover:border-[var(--accent)]/30 hover:shadow-lg"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-white">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-[var(--foreground)]/50">{count} products</p>
      </div>
    </a>
  );
}
