"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "../../../components/product-card";
import { FilterSidebar } from "../../../components/filter-sidebar";
import { Pagination } from "../../../components/pagination";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  color: string;
  brand: string;
  colorName: string;
  rating: number;
}

interface CategoryListingProps {
  title: string;
  products: Product[];
}

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

const PER_PAGE = 8;

const COLOR_MAP: Record<string, string> = {
  Black: "#1e293b",
  White: "#e2e8f0",
  Red: "#f87171",
  Blue: "#60a5fa",
  Green: "#34d399",
  Purple: "#a78bfa",
  Orange: "#fb923c",
  Yellow: "#fbbf24",
  Pink: "#f472b6",
  Teal: "#2dd4bf",
  Gray: "#94a3b8",
  Silver: "#94a3b8",
};

function deriveFilters(products: Product[]) {
  const brandCounts: Record<string, number> = {};
  const colorSet = new Set<string>();
  const ratingCounts: Record<number, number> = {};

  for (const p of products) {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    colorSet.add(p.colorName);
    for (let r = p.rating; r >= 1; r--) {
      ratingCounts[r] = (ratingCounts[r] || 0) + 1;
    }
  }

  return {
    brands: Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, checked: false })),
    colors: Array.from(colorSet)
      .sort()
      .map((name) => ({ name, hex: COLOR_MAP[name] || "#94a3b8", checked: false })),
    ratings: [5, 4, 3]
      .filter((r) => ratingCounts[r])
      .map((r) => ({ label: String(r), count: ratingCounts[r]!, checked: false })),
  };
}

export function CategoryListing({ title, products }: CategoryListingProps) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [page, setPage] = useState(1);
  const [gridView, setGridView] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [brands, setBrands] = useState(() => deriveFilters(products).brands);
  const [colors, setColors] = useState(() => deriveFilters(products).colors);
  const [ratings, setRatings] = useState(() => deriveFilters(products).ratings);

  const toggleBrand = (label: string) =>
    setBrands((prev) =>
      prev.map((b) => (b.label === label ? { ...b, checked: !b.checked } : b)),
    );
  const toggleColor = (name: string) =>
    setColors((prev) =>
      prev.map((c) => (c.name === name ? { ...c, checked: !c.checked } : c)),
    );
  const toggleRating = (label: string) =>
    setRatings((prev) =>
      prev.map((r) => (r.label === label ? { ...r, checked: !r.checked } : r)),
    );
  const clearAll = () => {
    setPriceRange([0, 200]);
    setBrands((prev) => prev.map((b) => ({ ...b, checked: false })));
    setColors((prev) => prev.map((c) => ({ ...c, checked: false })));
    setRatings((prev) => prev.map((r) => ({ ...r, checked: false })));
  };

  const filtered = useMemo(() => {
    const activeBrands = brands.filter((b) => b.checked).map((b) => b.label);
    const activeColors = colors.filter((c) => c.checked).map((c) => c.name);
    const activeRatings = ratings
      .filter((r) => r.checked)
      .map((r) => Number(r.label));
    const minRating = activeRatings.length ? Math.min(...activeRatings) : 0;

    let result = products.filter(
      (p) =>
        p.price >= priceRange[0] &&
        p.price <= priceRange[1] &&
        (!activeBrands.length || activeBrands.includes(p.brand)) &&
        (!activeColors.length || activeColors.includes(p.colorName)) &&
        p.rating >= minRating,
    );

    switch (sort) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [products, priceRange, brands, colors, ratings, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filters = { priceRange, brands, colors, ratings };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-sm text-[var(--foreground)]/50">
          {filtered.length} product{filtered.length !== 1 && "s"}
        </span>
      </div>

      <div className="mt-6 flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden w-60 shrink-0 lg:block">
          <FilterSidebar
            filters={filters}
            onPriceChange={(r) => { setPriceRange(r); setPage(1); }}
            onBrandToggle={(l) => { toggleBrand(l); setPage(1); }}
            onColorToggle={(n) => { toggleColor(n); setPage(1); }}
            onRatingToggle={(l) => { toggleRating(l); setPage(1); }}
            onClear={clearAll}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[var(--muted)] lg:hidden"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-sm text-[var(--foreground)]/50 sm:inline">
                Sort by:
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                aria-label="Grid view"
                onClick={() => setGridView(true)}
                className={`rounded-lg p-2 transition-colors ${gridView ? "bg-[var(--muted)] text-[var(--accent)]" : "text-[var(--foreground)]/40 hover:bg-[var(--muted)]"}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                aria-label="List view"
                onClick={() => setGridView(false)}
                className={`rounded-lg p-2 transition-colors ${!gridView ? "bg-[var(--muted)] text-[var(--accent)]" : "text-[var(--foreground)]/40 hover:bg-[var(--muted)]"}`}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Product grid / list */}
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" className="mb-4 text-[var(--foreground)]/20">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="font-medium text-[var(--foreground)]/50">No products found</p>
              <p className="mt-1 text-sm text-[var(--foreground)]/30">
                Try adjusting your filters
              </p>
              <button
                onClick={clearAll}
                className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : gridView ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((p) => (
                <a key={p.id} href={`/product/${p.id}`}>
                  <ProductCard
                    name={p.name}
                    price={p.price}
                    originalPrice={p.originalPrice}
                    badge={p.badge}
                    color={p.color}
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paged.map((p) => (
                <a
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 transition-all hover:shadow-md"
                >
                  <div
                    className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.badge && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {p.badge}
                      </span>
                    )}
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5" className="opacity-40">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <h3 className="font-medium leading-snug">{p.name}</h3>
                    <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                      {p.brand} &middot; {p.colorName}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--accent)]">
                        ${p.price.toFixed(2)}
                      </span>
                      {p.originalPrice && (
                        <span className="text-sm text-[var(--foreground)]/40 line-through">
                          ${p.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-[var(--background)] p-5 shadow-xl lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg p-1.5 text-[var(--foreground)]/50 hover:bg-[var(--muted)]"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              onPriceChange={(r) => { setPriceRange(r); setPage(1); }}
              onBrandToggle={(l) => { toggleBrand(l); setPage(1); }}
              onColorToggle={(n) => { toggleColor(n); setPage(1); }}
              onRatingToggle={(l) => { toggleRating(l); setPage(1); }}
              onClear={clearAll}
            />
          </div>
        </>
      )}
    </section>
  );
}
