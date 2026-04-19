"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";

function ThankYouInner() {
  const params = useSearchParams();
  const type = params.get("type") || "Your Inquiry";
  const name = params.get("name") || "";

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-light)]">
        <svg
          width="40"
          height="40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--accent)]"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-bold text-[var(--foreground)]">
        Thank You{name ? `, ${name}` : ""}!
      </h1>

      <p className="mt-3 text-lg text-[var(--foreground)]/60">
        Your <strong className="text-[var(--foreground)]">{type}</strong> request
        has been submitted successfully.
      </p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 text-left">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          What happens next?
        </h2>
        <ul className="mt-4 space-y-3">
          {[
            {
              step: "1",
              title: "Confirmation Email",
              desc: "You'll receive a confirmation email with your inquiry details shortly.",
            },
            {
              step: "2",
              title: "Team Review",
              desc: "Our team will review your request and prepare a detailed response.",
            },
            {
              step: "3",
              title: "We'll Get Back to You",
              desc: "Expect a reply within 1-2 business hours during business days.",
            },
          ].map((item) => (
            <li key={item.step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--foreground)]/50">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/#shop">
          <Button size="lg">Continue Shopping</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" size="lg">
            Contact Us
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-sm text-[var(--foreground)]/40">
        Need immediate help? Call us at{" "}
        <strong className="text-[var(--foreground)]/60">1-888-487-8607</strong>{" "}
        (Mon-Fri 9AM - 6PM)
      </p>
    </section>
  );
}

export function ThankYouContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-[var(--foreground)]/50">Loading...</p>
        </div>
      }
    >
      <ThankYouInner />
    </Suspense>
  );
}
