import Link from "next/link";
import { type ReactNode } from "react";

interface CategoryCardProps {
  name: string;
  count: number;
  icon: ReactNode;
  slug: string;
  /** Uploaded category image; shown instead of the icon when present. */
  image?: string;
  /**
   * "compact" (default) — small icon/thumbnail card used on the home grid.
   * "tile" — product-card style with a large, prominent image area.
   */
  layout?: "compact" | "tile";
  /**
   * How the image fills its frame. "cover" (default) fills/crops — right for
   * admin-assigned banner-style category images. "contain" shows the whole
   * image without cropping — used when the tile falls back to a product photo,
   * so product images aren't chopped (they'd render fully on the product page).
   */
  imageFit?: "cover" | "contain";
}

export function CategoryCard({
  name,
  count,
  icon,
  slug,
  image,
  layout = "compact",
  imageFit = "cover",
}: CategoryCardProps) {
  const fitClass = imageFit === "contain" ? "object-contain" : "object-cover";
  // Contained product photos sit on white so the frame blends with the image's
  // own white background; the icon fallback keeps the muted tint.
  const frameBg = image && imageFit === "contain" ? "bg-white" : "bg-[var(--muted)]";
  if (layout === "tile") {
    return (
      <Link
        href={`/${slug}`}
        className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div className={`relative flex h-52 items-center justify-center overflow-hidden ${frameBg}`}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              className={`h-full w-full ${fitClass} transition-transform duration-300 group-hover:scale-105`}
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]">
              {icon}
            </span>
          )}
        </div>
        <div className="p-4 text-center">
          <p className="font-semibold text-[var(--foreground)]">{name}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground)]/45">
            {count} products
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent)]/30 hover:shadow-md"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className={`h-14 w-14 rounded-xl ${fitClass}`}
        />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-white">
          {icon}
        </span>
      )}
      <div>
        <p className="font-semibold text-[var(--foreground)]">{name}</p>
        <p className="text-xs text-[var(--foreground)]/45">{count} products</p>
      </div>
    </Link>
  );
}
