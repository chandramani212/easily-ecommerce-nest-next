"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/cart-context";
import { Button } from "@repo/ui/button";

type Step = "shipping" | "payment" | "review" | "confirmation";

const STEPS: { key: Step; label: string }[] = [
  { key: "shipping", label: "Shipping" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
];

interface ShippingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PaymentData {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

const INITIAL_SHIPPING: ShippingData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

const INITIAL_PAYMENT: PaymentData = {
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvv: "",
};

export function CheckoutFlow() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>("shipping");
  const [shipping, setShipping] = useState<ShippingData>(INITIAL_SHIPPING);
  const [payment, setPayment] = useState<PaymentData>(INITIAL_PAYMENT);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard",
  );

  const shippingCost =
    subtotal > 50 && shippingMethod === "standard"
      ? 0
      : shippingMethod === "express"
        ? 12.99
        : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  if (items.length === 0 && step !== "confirmation") {
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
            Add some products before checking out.
          </p>
          <Link href="/#shop">
            <Button size="lg" className="mt-6">
              Browse Products
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  if (step === "confirmation") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className="text-emerald-600 dark:text-emerald-400"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold">Order Confirmed!</h1>
          <p className="mt-2 text-[var(--foreground)]/50">
            Thank you for your purchase. We&apos;ve sent a confirmation email to{" "}
            <strong className="text-[var(--foreground)]">{shipping.email}</strong>.
          </p>
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6">
            <p className="text-sm text-[var(--foreground)]/50">Order Number</p>
            <p className="mt-1 text-xl font-bold tracking-wider text-[var(--accent)]">
              #EB-{Date.now().toString(36).toUpperCase().slice(-8)}
            </p>
            <div className="mt-4 flex justify-center gap-8 text-sm">
              <div>
                <p className="text-[var(--foreground)]/50">Shipping</p>
                <p className="font-medium">
                  {shippingMethod === "express" ? "Express (2-3 days)" : "Standard (5-7 days)"}
                </p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/50">Total</p>
                <p className="font-medium">${total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <Link href="/">
            <Button size="lg" className="mt-8">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Step indicator */}
      <div className="mb-10">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    i < currentStepIdx
                      ? "bg-emerald-500 text-white"
                      : i === currentStepIdx
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--muted)] text-[var(--foreground)]/40"
                  }`}
                >
                  {i < currentStepIdx ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    i <= currentStepIdx ? "text-[var(--foreground)]" : "text-[var(--foreground)]/40"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-16 sm:w-24 ${
                    i < currentStepIdx ? "bg-emerald-500" : "bg-[var(--border)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === "shipping" && (
            <ShippingStep
              data={shipping}
              shippingMethod={shippingMethod}
              onChange={setShipping}
              onMethodChange={setShippingMethod}
              onNext={() => setStep("payment")}
            />
          )}
          {step === "payment" && (
            <PaymentStep
              data={payment}
              onChange={setPayment}
              onBack={() => setStep("shipping")}
              onNext={() => setStep("review")}
            />
          )}
          {step === "review" && (
            <ReviewStep
              shipping={shipping}
              payment={payment}
              shippingMethod={shippingMethod}
              onBack={() => setStep("payment")}
              onConfirm={() => {
                clearCart();
                setStep("confirmation");
              }}
            />
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6">
            <h2 className="text-lg font-bold">Order Summary</h2>
            <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: item.color }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5" className="opacity-40">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{item.name}</p>
                    <p className="text-[var(--foreground)]/50">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">Shipping</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]/60">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base">
                <span className="font-bold">Total</span>
                <span className="font-bold text-[var(--accent)]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Shipping Step ---------- */

function ShippingStep({
  data,
  shippingMethod,
  onChange,
  onMethodChange,
  onNext,
}: {
  data: ShippingData;
  shippingMethod: "standard" | "express";
  onChange: (d: ShippingData) => void;
  onMethodChange: (m: "standard" | "express") => void;
  onNext: () => void;
}) {
  const update = (field: keyof ShippingData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <h2 className="text-xl font-bold">Shipping Information</h2>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="First Name" required value={data.firstName} placeholder="John" onChange={(v) => update("firstName", v)} />
          <FormField label="Last Name" required value={data.lastName} placeholder="Doe" onChange={(v) => update("lastName", v)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" type="email" required value={data.email} placeholder="john@example.com" onChange={(v) => update("email", v)} />
          <FormField label="Phone" type="tel" value={data.phone} placeholder="+1 (555) 123-4567" onChange={(v) => update("phone", v)} />
        </div>
        <FormField label="Street Address" required value={data.address} placeholder="123 Main Street" onChange={(v) => update("address", v)} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <FormField label="City" required value={data.city} placeholder="San Francisco" onChange={(v) => update("city", v)} />
          </div>
          <FormField label="State" required value={data.state} placeholder="CA" onChange={(v) => update("state", v)} />
          <FormField label="ZIP Code" required value={data.zip} placeholder="94102" onChange={(v) => update("zip", v)} />
        </div>

        {/* Shipping method */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">Shipping Method</p>
          <div className="space-y-2">
            {(["standard", "express"] as const).map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  shippingMethod === method
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border)] hover:bg-[var(--muted)]"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === method}
                  onChange={() => onMethodChange(method)}
                  className="accent-[var(--accent)]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {method === "standard" ? "Standard Shipping" : "Express Shipping"}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {method === "standard" ? "5-7 business days" : "2-3 business days"}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {method === "standard" ? "Free (over $50)" : "$12.99"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Button size="lg" type="submit">
          Continue to Payment
        </Button>
      </div>
    </form>
  );
}

/* ---------- Payment Step ---------- */

function PaymentStep({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: PaymentData;
  onChange: (d: PaymentData) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const update = (field: keyof PaymentData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <h2 className="text-xl font-bold">Payment Information</h2>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground)]/40">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        All payment details are encrypted and secure
      </div>

      <div className="mt-6 space-y-4">
        <FormField
          label="Card Number"
          required
          value={data.cardNumber}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          onChange={(v) =>
            update(
              "cardNumber",
              v
                .replace(/\D/g, "")
                .replace(/(\d{4})/g, "$1 ")
                .trim(),
            )
          }
        />
        <FormField
          label="Name on Card"
          required
          value={data.cardName}
          placeholder="John Doe"
          onChange={(v) => update("cardName", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Expiry Date"
            required
            value={data.expiry}
            placeholder="MM/YY"
            maxLength={5}
            onChange={(v) => {
              const clean = v.replace(/\D/g, "");
              const formatted =
                clean.length > 2
                  ? clean.slice(0, 2) + "/" + clean.slice(2, 4)
                  : clean;
              update("expiry", formatted);
            }}
          />
          <FormField
            label="CVV"
            required
            value={data.cvv}
            placeholder="123"
            maxLength={4}
            onChange={(v) => update("cvv", v.replace(/\D/g, ""))}
          />
        </div>
      </div>

      {/* Accepted cards */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-xs text-[var(--foreground)]/40">We accept:</span>
        {["Visa", "MC", "Amex", "Disc"].map((card) => (
          <span
            key={card}
            className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold text-[var(--foreground)]/50"
          >
            {card}
          </span>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" size="lg" type="button" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" type="submit">
          Review Order
        </Button>
      </div>
    </form>
  );
}

/* ---------- Review Step ---------- */

function ReviewStep({
  shipping,
  payment,
  shippingMethod,
  onBack,
  onConfirm,
}: {
  shipping: ShippingData;
  payment: PaymentData;
  shippingMethod: "standard" | "express";
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { items } = useCart();

  return (
    <div>
      <h2 className="text-xl font-bold">Review Your Order</h2>
      <p className="mt-1 text-sm text-[var(--foreground)]/50">
        Please review the details below before placing your order.
      </p>

      <div className="mt-6 space-y-6">
        {/* Shipping info */}
        <div className="rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Shipping Address</h3>
            <button
              onClick={onBack}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="mt-2 text-sm text-[var(--foreground)]/60">
            <p>
              {shipping.firstName} {shipping.lastName}
            </p>
            <p>{shipping.address}</p>
            <p>
              {shipping.city}, {shipping.state} {shipping.zip}
            </p>
            <p>{shipping.email}</p>
          </div>
          <p className="mt-2 text-sm">
            <span className="text-[var(--foreground)]/50">Method:</span>{" "}
            <strong>
              {shippingMethod === "express"
                ? "Express (2-3 days)"
                : "Standard (5-7 days)"}
            </strong>
          </p>
        </div>

        {/* Payment info */}
        <div className="rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Payment Method</h3>
            <button
              onClick={onBack}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="mt-2 text-sm text-[var(--foreground)]/60">
            <p>
              Card ending in ****{" "}
              {payment.cardNumber.replace(/\s/g, "").slice(-4)}
            </p>
            <p>{payment.cardName}</p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold">
            Items ({items.length})
          </h3>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: item.color }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5" className="opacity-40">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-[var(--foreground)]/50">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onConfirm}>
          Place Order
        </Button>
      </div>
    </div>
  );
}

/* ---------- Shared form field ---------- */

function FormField({
  label,
  type = "text",
  required,
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
      />
    </div>
  );
}
