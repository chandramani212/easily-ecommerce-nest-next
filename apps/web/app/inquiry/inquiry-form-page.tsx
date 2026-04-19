"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InquiryForm } from "../../components/inquiry-form";

function InquiryInner() {
  const params = useSearchParams();
  const type = params.get("type") || undefined;
  const product = params.get("product") || undefined;

  return (
    <section className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:px-8">
      <InquiryForm defaultType={type} productName={product} />
    </section>
  );
}

export function InquiryFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-[var(--foreground)]/50">Loading...</p>
        </div>
      }
    >
      <InquiryInner />
    </Suspense>
  );
}
