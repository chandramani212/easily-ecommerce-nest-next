"use client";

import { useState } from "react";

interface QuantitySelectorProps {
  min?: number;
  max?: number;
  initial?: number;
}

export function QuantitySelector({
  min = 1,
  max = 99,
  initial = 1,
}: QuantitySelectorProps) {
  const [qty, setQty] = useState(initial);

  const decrement = () => setQty((q) => Math.max(min, q - 1));
  const increment = () => setQty((q) => Math.min(max, q + 1));

  return (
    <div className="inline-flex items-center rounded-lg border border-[var(--border)]">
      <button
        onClick={decrement}
        disabled={qty <= min}
        className="flex h-10 w-10 items-center justify-center text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="flex h-10 w-12 items-center justify-center border-x border-[var(--border)] text-sm font-semibold">
        {qty}
      </span>
      <button
        onClick={increment}
        disabled={qty >= max}
        className="flex h-10 w-10 items-center justify-center text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
