"use client";

import { PriceRangeSlider } from "./price-range-slider";

interface FilterOption {
  label: string;
  count: number;
  checked: boolean;
}

interface Filters {
  priceRange: [number, number];
  brands: FilterOption[];
  colors: { name: string; hex: string; checked: boolean }[];
  ratings: FilterOption[];
}

interface FilterSidebarProps {
  filters: Filters;
  onPriceChange: (range: [number, number]) => void;
  onBrandToggle: (label: string) => void;
  onColorToggle: (name: string) => void;
  onRatingToggle: (label: string) => void;
  onClear: () => void;
}

export function FilterSidebar({
  filters,
  onPriceChange,
  onBrandToggle,
  onColorToggle,
  onRatingToggle,
  onClear,
}: FilterSidebarProps) {
  const hasActive =
    filters.brands.some((b) => b.checked) ||
    filters.colors.some((c) => c.checked) ||
    filters.ratings.some((r) => r.checked);

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
          Filters
        </h3>
        {hasActive && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <PriceRangeSlider
          min={0}
          max={200}
          onChange={onPriceChange}
        />
      </FilterSection>

      {/* Brands */}
      {filters.brands.length > 0 && (
      <FilterSection title="Brand">
        <div className="space-y-2">
          {filters.brands.map((b) => (
            <label
              key={b.label}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={b.checked}
                onChange={() => onBrandToggle(b.label)}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] accent-[var(--accent)]"
              />
              <span className="flex-1">{b.label}</span>
              <span className="text-xs text-[var(--foreground)]/40">{b.count}</span>
            </label>
          ))}
        </div>
      </FilterSection>
      )}

      {/* Colors */}
      {filters.colors.length > 0 && (
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {filters.colors.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => onColorToggle(c.name)}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                c.checked
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                  : "border-[var(--border)]"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </FilterSection>
      )}

      {/* Ratings — temporarily hidden until real rating data is available.
      {filters.ratings.length > 0 && (
      <FilterSection title="Rating">
        <div className="space-y-2">
          {filters.ratings.map((r) => (
            <label
              key={r.label}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={r.checked}
                onChange={() => onRatingToggle(r.label)}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] accent-[var(--accent)]"
              />
              <Stars count={Number(r.label)} />
              <span className="text-xs text-[var(--foreground)]/40">
                ({r.count})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
      )}
      */}
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--border)] pt-5">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={i < count ? "text-amber-400" : "text-neutral-300"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="ml-0.5 text-sm text-[var(--foreground)]/60">& up</span>
    </span>
  );
}
