"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  color: string;
  href?: string;
  image?: string;
}

interface Tab {
  key: string;
  label: string;
  products: Product[];
}

export function BestSellersTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`rounded-full border px-6 py-2.5 text-sm font-medium transition-all ${
              active === tab.key
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]/70 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {current.products.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[var(--foreground)]/50">
              No products available.
            </p>
          ) : (
            current.products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
