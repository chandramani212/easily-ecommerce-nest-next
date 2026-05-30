"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { ProductGallery } from "../../../components/product-gallery";
import { ProductTabs } from "../../../components/product-tabs";
import { useCart } from "../../../context/cart-context";

interface ProductImage {
  id: string;
  color: string;
  label: string;
  url?: string;
  thumbUrl?: string;
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
  shortDescription?: string;
  additionalInfo: string;
  quantityPricing: QuantityPrice[];
  colorVariations?: string;
}

const ACTION_BUTTONS = [
  {
    key: "Instant Quote",
    label: "Instant Quote",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "Free Visual",
    label: "Free Visual",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    key: "Order a Sample",
    label: "Order a Sample",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "Order Online",
    label: "Order Online",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
];

export function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.sku,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        color: product.images[0]?.color ?? "#818cf8",
      },
      qty,
    );
  };

  const inquiryUrl = (type: string) =>
    `/inquiry?type=${encodeURIComponent(type)}&product=${encodeURIComponent(product.name)}`;

  const descriptionText =
    (product.description && product.description.trim()) ||
    (product.shortDescription && product.shortDescription.trim()) ||
    "";

  const descriptionContent = descriptionText ? (
    <div className="space-y-4">
      <p className="whitespace-pre-line">{descriptionText}</p>
      {product.colorVariations && (
        <div className="flex gap-4">
          <span className="shrink-0 font-medium text-[var(--foreground)]">
            Color variations
          </span>
          <span>{product.colorVariations}</span>
        </div>
      )}
    </div>
  ) : null;

  const shippingContent = (
    <div className="space-y-5">
      <div>
        <h4 className="mb-1.5 font-semibold text-[var(--foreground)]">Shipping Costs –</h4>
        <p>
          Shipping costs vary depending on the service level, volume, weight, and destination
          of your order. When you request a quotation, we&apos;ll include all shipping costs
          upfront so there are no surprises.
        </p>
      </div>
      <div>
        <h4 className="mb-1.5 font-semibold text-[var(--foreground)]">Express Service –</h4>
        <p>
          We offer thousands of promotional products available for express dispatch — typically
          same or next day. If your deadline is tight, call us at{" "}
          <strong className="text-[var(--foreground)]">1-888-487-8607</strong>, and our team
          will find the fastest option for you.
        </p>
      </div>
    </div>
  );

  const artworkContent = (
    <div className="space-y-5">
      <div>
        <h4 className="mb-1.5 font-semibold text-[var(--foreground)]">Artwork Setup –</h4>
        <p>
          Different products use different print processes, and we&apos;ll always advise on the
          best option for your design.
        </p>
      </div>
      <div>
        <p>
          You can call <strong className="text-[var(--foreground)]">1-888-487-8607</strong> if
          you&apos;d like to discuss your artwork or printing method in advance.
        </p>
      </div>
      <div>
        <h4 className="mb-1.5 font-semibold text-[var(--foreground)]">Vector Files (EPS, PDF, AI) –</h4>
        <p>
          Vector files are ideal for all print methods. Any gradient or tinted areas in your
          artwork may need to be converted to solid colors. If you don&apos;t have vector artwork,
          simply send what you have — our design team can redraw it for you.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} />

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
                        Total
                      </th>
                      {/* Savings column hidden
                      <th className="px-4 py-2.5 text-left font-medium text-[var(--foreground)]/60">
                        Savings
                      </th>
                      */}
                    </tr>
                  </thead>
                  <tbody>
                    {product.quantityPricing.map((tier) => {
                      const qty = parseInt(tier.quantity, 10) || 0;
                      const total = qty * tier.price;
                      // const save =
                      //   product.price > tier.price
                      //     ? Math.round(
                      //         ((product.price - tier.price) / product.price) *
                      //           100,
                      //       )
                      //     : 0;
                      return (
                        <tr
                          key={tier.quantity}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="px-4 py-2.5">{qty}</td>
                          <td className="px-4 py-2.5 font-medium">
                            ${tier.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            ${total.toFixed(2)}
                          </td>
                          {/* Savings column hidden
                          <td className="px-4 py-2.5">
                            {save > 0 ? (
                              <Badge variant="success">{save}% off</Badge>
                            ) : (
                              <span className="text-[var(--foreground)]/40">
                                &mdash;
                              </span>
                            )}
                          </td>
                          */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Primary B2B actions — link to inquiry page */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {ACTION_BUTTONS.map((btn) => (
                <Link
                  key={btn.key}
                  href={inquiryUrl(btn.key)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent)]/90"
                >
                  {btn.icon}
                  {btn.label}
                </Link>
              ))}
            </div>

            {/* Secondary: Add to Cart */}
            <div className="mt-4 flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-9 w-9 items-center justify-center text-[var(--foreground)]/50 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="flex h-9 w-10 items-center justify-center border-x border-[var(--border)] text-xs font-semibold">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  disabled={qty >= 99}
                  className="flex h-9 w-9 items-center justify-center text-[var(--foreground)]/50 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]/60 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </button>
              <button
                aria-label="Add to wishlist"
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground)]/40 transition-colors hover:border-red-300 hover:text-red-500"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

      {/* Tab sections - Description & Specs, Shipping, Artwork */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProductTabs
            tabs={[
              ...(descriptionContent
                ? [{ label: "Description & Specs", content: descriptionContent }]
                : []),
              { label: "Shipping", content: shippingContent },
              { label: "Artwork", content: artworkContent },
            ]}
          />
        </div>
      </section>
    </>
  );
}
