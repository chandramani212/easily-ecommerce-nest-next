"use client";

import { useState, useRef, type MouseEvent } from "react";

interface ProductImage {
  id: string;
  color: string;
  label: string;
  url?: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  const current = images[selected]!;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image with hover zoom */}
      <div
        ref={containerRef}
        className="relative cursor-crosshair overflow-hidden rounded-2xl border border-[var(--border)]"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div
          className="flex aspect-square items-center justify-center overflow-hidden transition-transform duration-200"
          style={{
            backgroundColor: current.url ? "transparent" : current.color,
            transform: zoomed ? "scale(2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        >
          {current.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.label}
              className="h-full w-full object-contain"
            />
          ) : (
            <svg
              width="64"
              height="64"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="1"
              className="opacity-30"
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )}
        </div>

        {/* Zoom hint icon */}
        <div className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-[var(--foreground)]/50">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setSelected(i)}
            className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
              i === selected
                ? "border-[var(--accent)] shadow-sm"
                : "border-[var(--border)] opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: img.url ? "transparent" : img.color }}
          >
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url}
                alt={img.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth="1.5"
                className="opacity-40"
              >
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
