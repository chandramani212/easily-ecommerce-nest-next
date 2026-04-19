import Link from "next/link";

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  color: string;
  href?: string;
}

export function ProductCard({
  name,
  price,
  originalPrice,
  badge,
  color,
  href,
}: ProductCardProps) {
  const slug = href || `/product/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <Link
      href={slug}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className="relative flex h-52 items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            {badge}
          </span>
        )}
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="1.5"
          className="opacity-40"
        >
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug text-[var(--foreground)]">{name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm text-[var(--foreground)]/50">from</span>
          <span className="text-lg font-bold text-[var(--accent)]">
            ${price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-sm text-[var(--foreground)]/35 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
