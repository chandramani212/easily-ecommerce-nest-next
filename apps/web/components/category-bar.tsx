"use client";

import { useState } from "react";
import Link from "next/link";

interface SubCategory {
  heading: string;
  items: { label: string; slug: string }[];
}

interface Category {
  name: string;
  slug: string;
  subs?: SubCategory[];
}

const CATEGORIES: Category[] = [
  {
    name: "T-Shirts",
    slug: "t-shirts",
    subs: [
      { heading: "By Style", items: [{ label: "Crew Neck", slug: "t-shirts" }, { label: "V-Neck", slug: "t-shirts" }, { label: "Polo", slug: "t-shirts" }, { label: "Long Sleeve", slug: "t-shirts" }] },
      { heading: "By Use", items: [{ label: "Corporate", slug: "t-shirts" }, { label: "Events", slug: "t-shirts" }, { label: "Sports", slug: "t-shirts" }] },
      { heading: "By Fabric", items: [{ label: "Cotton", slug: "t-shirts" }, { label: "Polyester", slug: "t-shirts" }, { label: "Organic", slug: "t-shirts" }] },
    ],
  },
  {
    name: "Stationery",
    slug: "stationery",
    subs: [
      { heading: "Writing", items: [{ label: "Pens", slug: "stationery" }, { label: "Pencils", slug: "stationery" }, { label: "Markers", slug: "stationery" }] },
      { heading: "Paper", items: [{ label: "Notebooks", slug: "stationery" }, { label: "Planners", slug: "stationery" }, { label: "Sticky Notes", slug: "stationery" }] },
      { heading: "Desk", items: [{ label: "Folders", slug: "stationery" }, { label: "Calendars", slug: "stationery" }, { label: "Bookmarks", slug: "stationery" }] },
    ],
  },
  {
    name: "Drinkware",
    slug: "drinkware",
    subs: [
      { heading: "Bottles", items: [{ label: "Water Bottles", slug: "drinkware" }, { label: "Sports Bottles", slug: "drinkware" }] },
      { heading: "Mugs", items: [{ label: "Coffee Mugs", slug: "drinkware" }, { label: "Travel Mugs", slug: "drinkware" }] },
      { heading: "Tumblers", items: [{ label: "Insulated", slug: "drinkware" }, { label: "Stainless Steel", slug: "drinkware" }] },
    ],
  },
  { name: "Bags", slug: "bags" },
  { name: "Tech", slug: "tech" },
  { name: "Corporate", slug: "corporate" },
  { name: "Headwear", slug: "headwear" },
  { name: "Wellness", slug: "wellness" },
];

export function CategoryBar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const activeCat = CATEGORIES.find((c) => c.name === activeCategory);
  const activeSubs = activeCat?.subs;

  return (
    <div className="relative z-40">
      {/* Desktop category bar */}
      <nav
        className="hidden border-b border-slate-700 bg-slate-800 md:block"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/category/${cat.slug}`}
              onMouseEnter={() => setActiveCategory(cat.subs ? cat.name : null)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeCategory === cat.name
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Mega-menu dropdown */}
        {activeCategory && activeSubs && activeCat && (
          <div
            className="absolute left-0 right-0 border-b border-[var(--border)] bg-[var(--background)] shadow-lg"
            onMouseEnter={() => setActiveCategory(activeCategory)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-4 gap-6 px-4 py-6 sm:px-6 lg:px-8">
              {activeSubs.map((sub) => (
                <div key={sub.heading}>
                  <h4 className="mb-2 text-sm font-semibold text-[var(--accent)]">
                    {sub.heading}
                  </h4>
                  <ul className="space-y-1.5">
                    {sub.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={`/category/${item.slug}`}
                          className="block text-sm text-[var(--foreground)]/70 transition-colors hover:text-[var(--accent)]"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile category toggle */}
      <div className="border-b border-[var(--border)] md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between bg-slate-800 px-4 py-3 text-sm font-medium text-white"
        >
          <span className="flex items-center gap-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Browse Categories
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto bg-[var(--background)]">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="border-b border-[var(--border)] last:border-0">
                {cat.subs ? (
                  <button
                    onClick={() =>
                      setMobileExpanded(mobileExpanded === cat.name ? null : cat.name)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                  >
                    {cat.name}
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${
                        mobileExpanded === cat.name ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={`/category/${cat.slug}`}
                    className="block px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                )}
                {cat.subs && mobileExpanded === cat.name && (
                  <div className="bg-[var(--muted)] px-4 pb-3">
                    <Link
                      href={`/category/${cat.slug}`}
                      className="mb-2 block text-sm font-medium text-[var(--accent)]"
                      onClick={() => setMobileOpen(false)}
                    >
                      View All {cat.name}
                    </Link>
                    {cat.subs.map((sub) => (
                      <div key={sub.heading} className="mb-3 last:mb-0">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                          {sub.heading}
                        </p>
                        {sub.items.map((item) => (
                          <Link
                            key={item.label}
                            href={`/category/${item.slug}`}
                            className="block py-1.5 text-sm text-[var(--foreground)]/70"
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
