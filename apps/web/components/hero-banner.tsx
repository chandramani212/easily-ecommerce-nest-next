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
}

const SLIDES: Slide[] = [
  {
    tag: "New Collection 2026",
    heading: "Quality Products,",
    highlight: "Made Easy",
    description:
      "Discover our curated collection of premium products. Affordable prices, fast delivery, and exceptional customer service.",
    ctaLabel: "Shop Now",
    ctaSecondaryLabel: "View Categories",
    gradient: "from-indigo-600 via-indigo-700 to-purple-800",
  },
  {
    tag: "Summer Sale",
    heading: "Up to 50% Off",
    highlight: "Top Brands",
    description:
      "Don't miss our biggest sale of the season. Premium electronics, fashion, and home essentials at unbeatable prices.",
    ctaLabel: "Shop Deals",
    ctaSecondaryLabel: "See All Offers",
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
  },
  {
    tag: "Free Shipping",
    heading: "Fast & Reliable",
    highlight: "Delivery",
    description:
      "Free shipping on all orders over $50. Get your products delivered to your door in 2-5 business days.",
    ctaLabel: "Start Shopping",
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
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

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
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
              className="!ui:bg-white !ui:text-slate-900 hover:!ui:bg-white/90"
            >
              {slide.ctaLabel}
            </Button>
            {slide.ctaSecondaryLabel && (
              <Button
                variant="outline"
                size="lg"
                className="!ui:border-white/40 !ui:text-white hover:!ui:bg-white/10"
              >
                {slide.ctaSecondaryLabel}
              </Button>
            )}
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
