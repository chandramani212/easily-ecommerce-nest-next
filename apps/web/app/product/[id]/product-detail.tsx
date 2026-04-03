"use client";

import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { ProductGallery } from "../../../components/product-gallery";
import { QuantitySelector } from "../../../components/quantity-selector";
import { ProductTabs } from "../../../components/product-tabs";

interface ProductImage {
  id: string;
  color: string;
  label: string;
}

interface QuantityPrice {
  quantity: string;
  price: number;
}

interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  sku: string;
  categories: string[];
  images: ProductImage[];
  description: string;
  additionalInfo: string;
  quantityPricing: QuantityPrice[];
}

export function ProductDetail({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: Gallery */}
          <ProductGallery images={product.images} />

          {/* Right: Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold text-[var(--accent)]">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-[var(--foreground)]/40 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              {discount && <Badge variant="danger">-{discount}%</Badge>}
            </div>

            {/* Stars (static) */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={i < 4 ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={i < 4 ? "text-amber-400" : "text-neutral-300"}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-[var(--foreground)]/50">
                4.0 (128 reviews)
              </span>
            </div>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--foreground)]/50">
              <span>
                SKU: <strong className="text-[var(--foreground)]">{product.sku}</strong>
              </span>
              <span>
                Categories:{" "}
                {product.categories.map((c, i) => (
                  <span key={c}>
                    <a href="#" className="text-[var(--accent)] hover:underline">
                      {c}
                    </a>
                    {i < product.categories.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>

            {/* Quantity pricing table */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Quantity Pricing</p>
              <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--muted)]">
                      <th className="px-4 py-2.5 text-left font-medium text-[var(--foreground)]/60">
                        Quantity
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-[var(--foreground)]/60">
                        Unit Price
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-[var(--foreground)]/60">
                        Savings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.quantityPricing.map((tier) => {
                      const save =
                        product.price > tier.price
                          ? Math.round(
                              ((product.price - tier.price) / product.price) *
                                100,
                            )
                          : 0;
                      return (
                        <tr
                          key={tier.quantity}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="px-4 py-2.5">{tier.quantity}</td>
                          <td className="px-4 py-2.5 font-medium">
                            ${tier.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5">
                            {save > 0 ? (
                              <Badge variant="success">{save}% off</Badge>
                            ) : (
                              <span className="text-[var(--foreground)]/40">
                                &mdash;
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <QuantitySelector />
              <Button size="lg" className="flex-1 sm:flex-none">
                Add to Cart
              </Button>
              <button
                aria-label="Add to wishlist"
                className="rounded-lg border border-[var(--border)] p-2.5 text-[var(--foreground)]/50 transition-colors hover:border-red-300 hover:text-red-500"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Perks */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a2 2 0 11-4 0m4 0H9m4 0h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a2 2 0 114 0m-4 0a2 2 0 104 0m6 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0", label: "Free Shipping" },
                { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "2 Year Warranty" },
                { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "30 Day Returns" },
                { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Secure Checkout" },
              ].map((perk) => (
                <div
                  key={perk.label}
                  className="flex items-center gap-2.5 rounded-lg bg-[var(--muted)] px-3 py-2.5"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="shrink-0 text-[var(--accent)]"
                  >
                    <path d={perk.icon} />
                  </svg>
                  <span className="text-xs font-medium">{perk.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs section */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProductTabs
            tabs={[
              { label: "Description", content: product.description },
              { label: "Additional Information", content: product.additionalInfo },
            ]}
          />
        </div>
      </section>
    </>
  );
}
