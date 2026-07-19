import Link from "next/link";
import { type ReactNode } from "react";

interface CategoryShowcaseCardProps {
  name: string;
  slug: string;
  count: number;
  /** Representative image (category image or first product image). */
  image?: string;
  /**
   * How the image fills its frame. "cover" (default) fills/crops — right for
   * admin-assigned banner-style category images. "contain" shows the whole
   * image without cropping — used when the tile falls back to a product photo.
   */
  imageFit?: "cover" | "contain";
  /** Icon shown on the light tint when no image is available. */
  icon: ReactNode;
}

/**
 * Alternative "Shop by Category" tile: an image-led card that stays in the
 * light, teal-accent theme — a soft muted image frame with the category name
 * and product count below on white, accent on hover. Falls back to a tinted
 * icon when no representative image exists. Contrasts with the icon-only
 * compact `CategoryCard` used on the home grid.
 */
export function CategoryShowcaseCard({
  name,
  slug,
  count,
  image,
  imageFit = "cover",
  icon,
}: CategoryShowcaseCardProps) {
  const fitClass = imageFit === "contain" ? "object-contain p-3" : "object-cover";
  // Contained product photos sit on white so the frame blends with the image's
  // own white background; the icon fallback keeps the muted tint.
  const frameBg = image && imageFit === "contain" ? "bg-white" : "bg-[var(--muted)]";
  return (
    <Link
      href={`/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg"
    >
      <div className={`relative flex h-40 items-center justify-center overflow-hidden ${frameBg} sm:h-44`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className={`h-full w-full ${fitClass} transition-transform duration-500 group-hover:scale-105`}
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]">
            {icon}
          </span>
        )}
      </div>

      <div className="p-4 text-center">
        <p className="font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
          {name}
        </p>
        {count > 0 && (
          <p className="mt-0.5 text-xs text-[var(--foreground)]/45">
            {count.toLocaleString()} products
          </p>
        )}
      </div>
    </Link>
  );
}
