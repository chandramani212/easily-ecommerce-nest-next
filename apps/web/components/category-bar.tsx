"use client";

import { useState } from "react";

interface SubCategory {
  heading: string;
  items: string[];
}

interface Category {
  name: string;
  subs?: SubCategory[];
}

const CATEGORIES: Category[] = [
  {
    name: "Electronics",
    subs: [
      { heading: "Computers", items: ["Laptops", "Desktops", "Monitors", "Keyboards"] },
      { heading: "Audio", items: ["Headphones", "Speakers", "Earbuds"] },
      { heading: "Smart Home", items: ["Smart Speakers", "Cameras", "Lighting"] },
      { heading: "Accessories", items: ["Chargers", "Cables", "Cases"] },
    ],
  },
  {
    name: "Clothing",
    subs: [
      { heading: "Men", items: ["T-Shirts", "Shirts", "Jeans", "Jackets"] },
      { heading: "Women", items: ["Dresses", "Tops", "Skirts", "Activewear"] },
      { heading: "Kids", items: ["Boys", "Girls", "Baby"] },
      { heading: "Footwear", items: ["Sneakers", "Boots", "Sandals"] },
    ],
  },
  {
    name: "Home & Garden",
    subs: [
      { heading: "Furniture", items: ["Sofas", "Tables", "Chairs", "Beds"] },
      { heading: "Decor", items: ["Wall Art", "Lighting", "Rugs"] },
      { heading: "Garden", items: ["Planters", "Tools", "Outdoor Furniture"] },
    ],
  },
  {
    name: "Sports",
    subs: [
      { heading: "Fitness", items: ["Yoga Mats", "Weights", "Bands"] },
      { heading: "Outdoor", items: ["Camping", "Hiking", "Cycling"] },
      { heading: "Team Sports", items: ["Football", "Basketball", "Cricket"] },
    ],
  },
  {
    name: "Books",
    subs: [
      { heading: "Fiction", items: ["Thriller", "Romance", "Sci-Fi"] },
      { heading: "Non-Fiction", items: ["Biography", "Self-Help", "Business"] },
      { heading: "Academic", items: ["Textbooks", "Reference", "Journals"] },
    ],
  },
  { name: "Beauty" },
  { name: "Toys" },
  { name: "Automotive" },
  { name: "Health" },
  { name: "Office" },
];

export function CategoryBar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const activeSubs = CATEGORIES.find((c) => c.name === activeCategory)?.subs;

  return (
    <div className="relative z-40">
      {/* Desktop category bar */}
      <nav
        className="hidden border-b border-slate-700 bg-slate-800 md:block"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onMouseEnter={() => setActiveCategory(cat.subs ? cat.name : null)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeCategory === cat.name
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Mega-menu dropdown */}
        {activeCategory && activeSubs && (
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
                      <li key={item}>
                        <a
                          href="#"
                          className="block text-sm text-[var(--foreground)]/70 transition-colors hover:text-[var(--accent)]"
                        >
                          {item}
                        </a>
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
                <button
                  onClick={() =>
                    setMobileExpanded(mobileExpanded === cat.name ? null : cat.name)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                >
                  {cat.name}
                  {cat.subs && (
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
                  )}
                </button>
                {cat.subs && mobileExpanded === cat.name && (
                  <div className="bg-[var(--muted)] px-4 pb-3">
                    {cat.subs.map((sub) => (
                      <div key={sub.heading} className="mb-3 last:mb-0">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                          {sub.heading}
                        </p>
                        {sub.items.map((item) => (
                          <a
                            key={item}
                            href="#"
                            className="block py-1.5 text-sm text-[var(--foreground)]/70"
                          >
                            {item}
                          </a>
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
