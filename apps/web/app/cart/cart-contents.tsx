"use client";

import Link from "next/link";
import { useCart } from "../../context/cart-context";
import { Button } from "@repo/ui/button";

export function CartContents() {
  const { items, removeItem, updateQuantity, subtotal, totalItems, clearCart } =
    useCart();

  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <svg
            width="64"
            height="64"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto text-[var(--foreground)]/20"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-[var(--foreground)]/50">
            Looks like you haven&apos;t added any products yet. Browse our shop
            to find something you love.
          </p>
          <Link href="/#shop">
            <Button size="lg" className="mt-6">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Shopping Cart{" "}
          <span className="text-base font-normal text-[var(--foreground)]/50">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 transition-colors hover:text-red-600"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 sm:gap-6 sm:p-6"
              >
                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg sm:h-28 sm:w-28"
                  style={{ backgroundColor: item.color }}
                >
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                    strokeWidth="1.5"
                    className="opacity-40"
                  >
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 shrink-0 text-[var(--foreground)]/40 transition-colors hover:text-red-500"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {item.originalPrice && (
                    <span className="mt-1 text-sm text-[var(--foreground)]/40 line-through">
                      ${item.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-[var(--accent)]">
                    ${item.price.toFixed(2)}
                  </span>

                  <div className="mt-auto flex items-center gap-3 pt-3">
                    <div className="inline-flex items-center rounded-lg border border-[var(--border)]">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)] disabled:opacity-30"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center border-x border-[var(--border)] text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)]"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]/50">
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/#shop"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition-colors hover:underline"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6">
            <h2 className="text-lg font-bold">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">
                  Estimated Tax
                </span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex justify-between text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-[var(--accent)]">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {shipping > 0 && (
              <p className="mt-3 text-xs text-[var(--foreground)]/50">
                Add ${(50 - subtotal).toFixed(2)} more for free shipping
              </p>
            )}

            <Link href="/checkout" className="block">
              <Button size="lg" className="mt-6 w-full">
                Proceed to Checkout
              </Button>
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--foreground)]/40">
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure checkout with SSL encryption
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
