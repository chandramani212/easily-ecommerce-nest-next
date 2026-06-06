"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/button";

interface Slide {
  tag: string;
  heading: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaSecondaryLabel?: string;
  gradient: string;
  /** Right-side image. Replace these placeholders with 1200×1200 art. */
  image: string;
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
    image: "/hero/slide-1.svg",
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

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % SLIDES.length),
    [],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = SLIDES[current]!;

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
        <div className="grid items-center gap-10 lg:grid-cols-2">
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
            <Button
              size="lg"
              className="!ui:bg-white !ui:text-slate-900 !ui:shadow-lg !ui:ring-1 !ui:ring-black/5 hover:!ui:bg-white/95"
            >
              {slide.ctaLabel}
            </Button>
            {slide.ctaSecondaryLabel && (
              <Button
                variant="secondary"
                size="lg"
                className="!ui:border !ui:border-white/30 !ui:bg-slate-900/60 !ui:text-white !ui:backdrop-blur-md !ui:shadow-md hover:!ui:bg-slate-900/80"
              >
                {slide.ctaSecondaryLabel}
              </Button>
            )}
          </div>
        </div>

          {/* Right-side image */}
          <div className="hidden lg:flex lg:justify-end">
            <div className="relative aspect-square w-full max-w-[520px] rounded-3xl bg-white/5 p-6 ring-1 ring-white/15 backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`img-${current}`}
                src={slide.image}
                alt=""
                className="h-full w-full animate-[fadeSlideIn_0.5s_ease-out_0.2s_both] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          aria-label="Previous slide"
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-4 lg:left-6"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          aria-label="Next slide"
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-4 lg:right-6"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
