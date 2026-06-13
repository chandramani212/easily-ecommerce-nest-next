import Link from "next/link";

export interface Tab {
  id: "overview" | "imports" | "products" | "categories" | "activity";
  label: string;
}

export function SourceDetailTabs({
  sourceId,
  tabs,
  active,
}: {
  sourceId: string;
  tabs: Tab[];
  active: Tab["id"];
}) {
  return (
    <nav
      className="flex gap-1 border-b border-[var(--admin-border)]"
      aria-label="Source sections"
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            href={
              t.id === "overview"
                ? `/sources/${sourceId}`
                : `/sources/${sourceId}?tab=${t.id}`
            }
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "text-[var(--admin-accent)]"
                : "text-[var(--admin-fg)]/70 hover:text-[var(--admin-fg)]"
            }`}
          >
            {t.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[var(--admin-accent)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
