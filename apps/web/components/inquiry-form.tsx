"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";

const INQUIRY_TYPES = [
  "Instant Quote",
  "Free Visual",
  "Order a Sample",
  "Order Online",
];

interface InquiryFormProps {
  defaultType?: string;
  productName?: string;
}

export function InquiryForm({ defaultType, productName }: InquiryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    inquiryType: defaultType || INQUIRY_TYPES[0]!,
    name: "",
    email: "",
    phone: "",
    company: "",
    quantity: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/thank-you?type=${encodeURIComponent(formData.inquiryType)}&name=${encodeURIComponent(formData.name)}`
    );
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[var(--foreground)]">
          Product Inquiry
        </h3>
        {productName && (
          <p className="mt-0.5 text-sm text-[var(--foreground)]/50">
            {productName}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Inquiry Type
          </label>
          <select
            value={formData.inquiryType}
            onChange={(e) => update("inquiryType", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          >
            {INQUIRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="john@company.com"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="1-888-487-8607"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Company name"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Quantity Needed
          </label>
          <input
            type="text"
            value={formData.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            placeholder="e.g. 100, 250, 500+"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Message
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us about your project, colors, artwork requirements..."
            className="w-full resize-none rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <Button size="lg" className="w-full">
          Submit Inquiry
        </Button>

        <p className="text-center text-xs text-[var(--foreground)]/40">
          We typically respond within 1-2 business hours.
        </p>
      </form>
    </div>
  );
}
