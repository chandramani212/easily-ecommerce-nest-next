"use client";

import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Shop", href: "#shop" },
  { label: "Contact", href: "#" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" className="shrink-0 text-xl font-bold tracking-tight text-[var(--accent)]">
          ShopEase
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[var(--foreground)]/70 transition-colors hover:text-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Expandable search */}
          <div className="relative flex items-center">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                searchOpen ? "w-48 opacity-100 sm:w-64" : "w-0 opacity-0"
              }`}
            >
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-2 pl-3 pr-8 text-sm outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
            </div>
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              className={`rounded-lg p-2 transition-colors ${
                searchOpen
                  ? "absolute right-0 text-[var(--accent)]"
                  : "text-[var(--foreground)]/60 hover:bg-[var(--muted)]"
              }`}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          <button
            aria-label="Cart"
            className="relative rounded-lg p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)]"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <button
            aria-label="Menu"
            className="rounded-lg p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--muted)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-[var(--border)] px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--muted)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
