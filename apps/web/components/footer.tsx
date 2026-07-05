import Link from "next/link";

const QUICK_LINKS = [
  { label: "Shop", href: "/#shop" },
  { label: "Categories", href: "/#categories" },
];

const COMPANY = [
  { label: "About Us", href: "/about" },
];

const SUPPORT = [
  { label: "Help Center", href: "/contact" },
  { label: "Contact Us", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-block">
              <img src="/logo.png" alt="Easily Branded" className="h-8 w-auto" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/60">
              Your trusted destination for custom branded products.
              Quality printing, fast delivery, and exceptional service.
            </p>
            <div className="mt-4 flex gap-3">
              {["twitter", "github", "instagram"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--foreground)]/50 transition-colors hover:text-[var(--accent)]"
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
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--accent)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <p className="text-sm font-medium text-[var(--foreground)]">info@easilybranded.com</p>
              <p className="text-xs text-[var(--foreground)]/50">Mon-Fri 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-[var(--foreground)]/40">
            &copy; {new Date().getFullYear()} Easily Branded. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/privacy"
              className="text-[var(--foreground)]/50 transition-colors hover:text-[var(--accent)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[var(--foreground)]/50 transition-colors hover:text-[var(--accent)]"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
