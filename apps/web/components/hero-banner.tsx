"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/button";

/** How the slider renders: the text + side-image layout, or a full-bleed
 * banner image that is itself the link. */
export type HeroVariant = "split" | "full";

export interface Slide {
  tag: string;
  heading: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  gradient: string;
  /** Right-side image. Replace these placeholders with 1200×1200 art. */
  image: string;
  /** "full" variant only — optional portrait crop shown on small screens. */
  imageMobile?: string;
  /** "full" variant only — link for the whole banner (falls back to ctaHref). */
  href?: string;
  /** "full" variant only — alt text for the banner image. */
  alt?: string;
}

const SLIDES: Slide[] = [
  {
    tag: "Custom Branding 2026",
    heading: "Your Brand,",
    highlight: "Made Easy",
    description:
      "Custom branded T-shirts, stationery, drinkware, and more. Premium quality printing with fast turnaround and bulk discounts.",
    ctaLabel: "Shop Now",
    ctaSecondaryLabel: "View Categories",
    gradient: "from-teal-700 via-emerald-700 to-green-800",
    image: "/hero/slide-1.png",
  },
  {
    tag: "Bulk Discount",
    heading: "Up to 50% Off",
    highlight: "Bulk Orders",
    description:
      "The more you order, the more you save. Perfect for events, teams, and corporate gifting at unbeatable prices.",
    ctaLabel: "Shop Deals",
    ctaSecondaryLabel: "See All Offers",
    gradient: "from-slate-800 via-slate-700 to-teal-800",
    image: "/hero/slide-2.svg",
  },
  {
    tag: "Free Shipping",
    heading: "Fast & Reliable",
    highlight: "Delivery",
    description:
      "Free shipping on all orders over $50. Get your products delivered to your door in 2-5 business days.",
    ctaLabel: "Start Shopping",
    gradient: "from-emerald-600 via-teal-600 to-slate-700",
    image: "/hero/slide-3.svg",
  },
];

const AUTO_PLAY_MS = 5000;

export function HeroBanner({
  slides,
  autoPlayMs,
  variant = "split",
}: {
  slides?: Slide[];
  autoPlayMs?: number;
  variant?: HeroVariant;
} = {}) {
  const data = slides && slides.length ? slides : SLIDES;
  const playMs = autoPlayMs ?? AUTO_PLAY_MS;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % data.length),
    [data.length],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + data.length) % data.length),
    [data.length],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, playMs);
    return () => clearInterval(id);
  }, [paused, next, playMs]);

  const slide = data[current] ?? data[0]!;

  const controls = (
    <SliderControls
      count={data.length}
      current={current}
      onPrev={prev}
      onNext={next}
      onGo={setCurrent}
    />
  );

  // Full-bleed banner: the image is the whole slide, and it is the link.
  if (variant === "full") {
    const href = slide.href || slide.ctaHref;
    const image = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`full-${current}`}
          src={slide.image}
          alt={slide.alt ?? ""}
          className={`h-full w-full animate-[fadeSlideIn_0.5s_ease-out] object-cover ${
            slide.imageMobile ? "hidden sm:block" : ""
          }`}
        />
        {slide.imageMobile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`full-mobile-${current}`}
            src={slide.imageMobile}
            alt={slide.alt ?? ""}
            className="h-full w-full animate-[fadeSlideIn_0.5s_ease-out] object-cover sm:hidden"
          />
        )}
      </>
    );

    return (
      <section
        className="relative overflow-hidden bg-slate-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={`relative w-full ${
            slide.imageMobile
              ? "aspect-[4/5] sm:aspect-[16/6]"
              : "aspect-[16/9] sm:aspect-[16/6]"
          }`}
        >
          {href ? (
            <a href={href} className="block h-full w-full">
              {image}
            </a>
          ) : (
            image
          )}
          {controls}
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background with transition */}
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 ${slide.gradient}`}
      />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/20" />
        <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-white/10" />
      </div>
      {/* Left-side darkening overlay so text + buttons stay legible on lighter gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Mobile image — stacked on top of the content */}
        <div className="lg:hidden">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`img-mobile-${current}`}
              src={slide.image}
              alt=""
              className="h-full w-full animate-[fadeSlideIn_0.5s_ease-out_0.2s_both] object-cover"
            />
          </div>
        </div>
        <div className="max-w-2xl">
          <span
            key={`tag-${current}`}
            className="mb-4 inline-block animate-[fadeSlideIn_0.5s_ease-out] rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
          >
            {slide.tag}
          </span>
          <h1
            key={`h-${current}`}
            className="animate-[fadeSlideIn_0.5s_ease-out_0.1s_both] text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {slide.heading}{" "}
            <span className="text-white/70">{slide.highlight}</span>
          </h1>
          <p
            key={`p-${current}`}
            className="mt-5 max-w-lg animate-[fadeSlideIn_0.5s_ease-out_0.2s_both] text-base leading-relaxed text-white/80 sm:text-lg"
          >
            {slide.description}
          </p>
          <div
            key={`cta-${current}`}
            className="mt-8 flex animate-[fadeSlideIn_0.5s_ease-out_0.3s_both] flex-wrap gap-4"
          >
            <a href={slide.ctaHref || "/#shop"}>
              <Button
                size="lg"
                className="!ui:bg-white !ui:text-slate-900 !ui:shadow-lg !ui:ring-1 !ui:ring-black/5 hover:!ui:bg-white/95"
              >
                {slide.ctaLabel}
              </Button>
            </a>
            {slide.ctaSecondaryLabel && (
              <a href={slide.ctaSecondaryHref || "/#shop"}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="!ui:border !ui:border-white/30 !ui:bg-slate-900/60 !ui:text-white !ui:backdrop-blur-md !ui:shadow-md hover:!ui:bg-slate-900/80"
                >
                  {slide.ctaSecondaryLabel}
                </Button>
              </a>
            )}
          </div>
        </div>

          {/* Right-side image */}
          <div className="hidden lg:flex lg:justify-end">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`img-${current}`}
                src={slide.image}
                alt=""
                className="h-full w-full animate-[fadeSlideIn_0.5s_ease-out_0.2s_both] object-cover"
              />
            </div>
          </div>
        </div>

        {controls}
      </div>
    </section>
  );
}

/** Prev / next arrows + dot indicators, shared by both slider variants. */
function SliderControls({
  count,
  current,
  onPrev,
  onNext,
  onGo,
}: {
  count: number;
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onGo: (i: number) => void;
}) {
  if (count < 2) return null;
  return (
    <>
      <button
        aria-label="Previous slide"
        onClick={onPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:left-4 lg:left-6"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next slide"
        onClick={onNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/45 sm:right-4 lg:right-6"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onGo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current
                ? "w-8 bg-white"
                : "w-2.5 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </>
  );
}
