"use client";

import { useState } from "react";

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
      { label: "All Products", href: "#" },
      { label: "Add Product", href: "#" },
      { label: "Categories", href: "#" },
    ],
  },
  {
    label: "Orders",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    children: [
      { label: "All Orders", href: "#" },
      { label: "Pending", href: "#" },
      { label: "Completed", href: "#" },
    ],
  },
  {
    label: "Customers",
    href: "#",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "#",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const PAGES: MenuItem[] = [
  {
    label: "Settings",
    href: "#",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "#",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (label: string) =>
    setExpanded(expanded === label ? null : label);

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
              expanded={expanded === item.label}
              onToggle={() => toggle(item.label)}
            />
          ))}

          <p className="mb-3 mt-6 px-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--admin-sidebar-fg)]/40">
            Pages
          </p>
          {PAGES.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              expanded={expanded === item.label}
              onToggle={() => toggle(item.label)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarItem({
  item,
  expanded,
  onToggle,
}: {
  item: MenuItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;

  const button = (
    <button
      onClick={hasChildren ? onToggle : undefined}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--admin-sidebar-fg)]/70 transition-colors hover:bg-white/10 hover:text-white"
    >
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
    </button>
  );

  if (!hasChildren) {
    return <a href={item.href || "#"}>{button}</a>;
  }

  return (
    <div>
      {button}
      {expanded && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-4">
          {item.children!.map((child) => (
            <a
              key={child.label}
              href={child.href}
              className="block rounded-md px-3 py-2 text-sm text-[var(--admin-sidebar-fg)]/50 transition-colors hover:text-white"
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
