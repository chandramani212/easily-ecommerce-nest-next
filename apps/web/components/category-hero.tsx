interface CategoryHeroProps {
  name: string;
  /** Already-normalized absolute image URL, or null/undefined to show the gradient. */
  bannerImage?: string | null;
}

/**
 * Hero-style header for a category page. When a banner image is set it fills the
 * background (darkened for legibility); otherwise it falls back to the same
 * teal→green gradient used by the home page hero. The category name is centered.
 *
 * Height is intentionally kept compact (smaller than the home hero) so it reads
 * as a section banner, not a landing hero.
 */
export function CategoryHero({ name, bannerImage }: CategoryHeroProps) {
  return (
    <section className="relative h-40 overflow-hidden sm:h-48 lg:h-56">
      {bannerImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Darkening overlay keeps the centered title legible over any image. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/30" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20" />
            <div className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full bg-white/10" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        </>
      )}

      <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
          {name}
        </h1>
      </div>
    </section>
  );
}
