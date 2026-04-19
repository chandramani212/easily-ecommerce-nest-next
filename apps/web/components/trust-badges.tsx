const BADGES = [
  {
    label: "Free Shipping",
    sub: "On orders over $50",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1m8-1a2 2 0 1 1-4 0m4 0H9m4 0h2.586a1 1 0 0 1 .707.293l2.414 2.414a1 1 0 0 1 .293.707V16a1 1 0 0 1-1 1h-1m-6-1a2 2 0 1 1 4 0m-4 0a2 2 0 1 0 4 0m6 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0" />
      </svg>
    ),
  },
  {
    label: "Premium Quality",
    sub: "Certified products",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: "Fast Delivery",
    sub: "2-5 business days",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: "24/7 Support",
    sub: "Always here to help",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
      </svg>
    ),
  },
  {
    label: "Best Prices",
    sub: "Guaranteed value",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
    ),
  },
  {
    label: "Secure Checkout",
    sub: "100% protected",
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
      </svg>
    ),
  },
];

export function TrustBadges() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--muted)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
        {BADGES.map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
              {badge.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{badge.label}</p>
              <p className="text-xs text-[var(--foreground)]/45">{badge.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
