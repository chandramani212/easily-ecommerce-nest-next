"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
        <svg
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-emerald-600 dark:text-emerald-400"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-emerald-800 dark:text-emerald-300">
          Message Sent!
        </h3>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-medium text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="mt-6 space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">First Name</label>
          <input
            type="text"
            required
            placeholder="John"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Last Name</label>
          <input
            type="text"
            required
            placeholder="Doe"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          required
          placeholder="john@example.com"
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Subject</label>
        <select className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]">
          <option value="">Select a topic</option>
          <option value="order">Order Inquiry</option>
          <option value="product">Product Question</option>
          <option value="return">Returns & Refunds</option>
          <option value="feedback">Feedback</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Message</label>
        <textarea
          required
          rows={5}
          placeholder="Tell us how we can help..."
          className="resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <Button size="lg" className="w-full">
        Send Message
      </Button>
    </form>
  );
}
