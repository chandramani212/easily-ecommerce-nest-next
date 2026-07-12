import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={`${i}-${item.label}`} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--foreground)]/30"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-[var(--foreground)]/50 transition-colors hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--foreground)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
