"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

const MENU: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 14a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
      </svg>
    ),
  },
  {
    label: "Products",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    children: [
      { label: "All Products", href: "/products" },
      { label: "Add Product", href: "/products/new" },
      { label: "Categories", href: "/categories" },
    ],
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/customers",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Inquiries",
    href: "/inquiries",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/contacts",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const PAGES: MenuItem[] = [
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const match = MENU.find((item) =>
      item.children?.some((c) => pathname.startsWith(c.href)),
    );
    if (match) setExpanded(match.label);
  }, [pathname]);

  const toggle = (label: string) =>
    setExpanded(expanded === label ? null : label);

  const isActive = (href?: string) =>
    href ? pathname === href || (href !== "/" && pathname.startsWith(href)) : false;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-[var(--admin-sidebar)] transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent)]">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold text-white">ShopEase</span>
          <span className="ml-1 rounded bg-[var(--admin-accent)]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--admin-accent)]">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--admin-sidebar-fg)]/40">
            Menu
          </p>
          {MENU.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              active={isActive(item.href)}
              expanded={expanded === item.label}
              onToggle={() => toggle(item.label)}
              pathname={pathname}
              onClose={onClose}
            />
          ))}

          <p className="mb-3 mt-6 px-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--admin-sidebar-fg)]/40">
            Administration
          </p>
          {PAGES.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              active={isActive(item.href)}
              expanded={expanded === item.label}
              onToggle={() => toggle(item.label)}
              pathname={pathname}
              onClose={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  active,
  expanded,
  onToggle,
  pathname,
  onClose,
}: {
  item: MenuItem;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  onClose: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const baseClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
  const activeClass = active
    ? "bg-white/10 text-white"
    : "text-[var(--admin-sidebar-fg)]/70 hover:bg-white/10 hover:text-white";

  const content = (
    <>
      <span className="shrink-0 opacity-60">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {hasChildren && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 opacity-40 transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </>
  );

  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`${baseClass} ${activeClass}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div>
      <button onClick={onToggle} className={`${baseClass} ${activeClass}`}>
        {content}
      </button>
      {expanded && hasChildren && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-4">
          {item.children!.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.label}
                href={child.href}
                onClick={onClose}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  childActive
                    ? "text-white"
                    : "text-[var(--admin-sidebar-fg)]/50 hover:text-white"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
