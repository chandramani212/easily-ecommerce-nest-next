const QUICK_LINKS = ["Shop", "Categories", "Deals", "New Arrivals"];
const COMPANY = ["About Us", "Careers", "Blog", "Press"];
const SUPPORT = ["Help Center", "Shipping Info", "Returns", "Contact Us"];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xl font-bold text-[var(--accent)]">
              ShopEase
            </span>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/60">
              Your trusted destination for quality products at competitive
              prices. Fast shipping and exceptional service.
            </p>
            <div className="mt-4 flex gap-3">
              {["twitter", "github", "instagram"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--background)] text-[var(--foreground)]/50 transition-colors hover:text-[var(--accent)]"
                >
                  <span className="text-xs font-medium uppercase">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Quick Links" items={QUICK_LINKS} />
          <FooterCol title="Company" items={COMPANY} />

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
              Support
            </h4>
            <ul className="space-y-2.5">
              {SUPPORT.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--accent)]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <p className="text-sm font-medium">info@shopease.com</p>
              <p className="text-xs text-[var(--foreground)]/50">Mon-Fri 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[var(--foreground)]/40">
            &copy; {new Date().getFullYear()} ShopEase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--accent)]"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
