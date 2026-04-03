"use client";

import { useState } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, onChange }: PriceRangeSliderProps) {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);

  const handleLow = (v: number) => {
    const clamped = Math.min(v, high - 1);
    setLow(clamped);
    onChange([clamped, high]);
  };

  const handleHigh = (v: number) => {
    const clamped = Math.max(v, low + 1);
    setHigh(clamped);
    onChange([low, clamped]);
  };

  const leftPct = ((low - min) / (max - min)) * 100;
  const rightPct = ((high - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium tabular-nums">
          ${low}
        </span>
        <span className="text-[var(--foreground)]/30">&ndash;</span>
        <span className="rounded border border-[var(--border)] px-2 py-1 text-xs font-medium tabular-nums">
          ${high}
        </span>
      </div>
      <div className="relative mt-3 h-1.5 rounded-full bg-[var(--muted)]">
        <div
          className="absolute h-full rounded-full bg-[var(--accent)]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={(e) => handleLow(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) => handleHigh(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
}
