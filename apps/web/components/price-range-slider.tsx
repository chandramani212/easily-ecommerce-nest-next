"use client";

import { useState } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  /** Selected range. The thumbs re-seed when it changes from outside (e.g.
   * "Clear all" or a URL filter). Defaults to the full bounds. */
  value?: [number, number];
  onChange: (range: [number, number]) => void;
  /** Called once when a drag or key press ends, with the final range. */
  onCommit?: (range: [number, number]) => void;
}

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  onCommit,
}: PriceRangeSliderProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const [low, setLow] = useState(clamp(value?.[0] ?? min));
  const [high, setHigh] = useState(clamp(value?.[1] ?? max));

  // Adopt an externally changed value (React's "adjust state on prop change").
  const [seen, setSeen] = useState(value);
  if (value && (value[0] !== seen?.[0] || value[1] !== seen?.[1])) {
    setSeen(value);
    setLow(clamp(value[0]));
    setHigh(clamp(value[1]));
  }

  const commit = () => onCommit?.([low, high]);

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
          onPointerUp={commit}
          onKeyUp={commit}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) => handleHigh(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          className="pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
}
