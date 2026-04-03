"use client";

import { useState, useEffect, useCallback } from "react";
import { TestimonialCard } from "./testimonial-card";

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  quote: string;
  rating: number;
}

interface TestimonialCarouselProps {
  items: Testimonial[];
}

const AUTO_PLAY_MS = 4000;

export function TestimonialCarousel({ items }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerPage(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = Math.ceil(items.length / perPage);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % totalPages),
    [totalPages],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + totalPages) % totalPages),
    [totalPages],
  );

  useEffect(() => {
    if (paused || totalPages <= 1) return;
    const id = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, next, totalPages]);

  const shiftPercent = current * (100 / totalPages);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${(items.length / perPage) * 100}%`,
            transform: `translateX(-${shiftPercent}%)`,
          }}
        >
          {items.map((t) => (
            <div
              key={t.name}
              className="px-2.5"
              style={{ width: `${100 / items.length}%` }}
            >
              <TestimonialCard {...t} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows -- only show when there's more than one page */}
      {totalPages > 1 && (
        <>
          <button
            aria-label="Previous testimonials"
            onClick={prev}
            className="absolute -left-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--background)] p-2 shadow-sm transition-colors hover:bg-[var(--muted)] sm:-left-5"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            aria-label="Next testimonials"
            onClick={next}
            className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--background)] p-2 shadow-sm transition-colors hover:bg-[var(--muted)] sm:-right-5"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to page ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-[var(--accent)]"
                  : "w-2.5 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
