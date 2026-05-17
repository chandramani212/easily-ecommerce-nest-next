"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryNode } from "../lib/adapt";

interface CategoryBarClientProps {
  categories: CategoryNode[];
}

export function CategoryBarClient({ categories }: CategoryBarClientProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(
    () => new Set(),
  );

  const activeCat = categories.find((c) => c.id === activeId);
  const showDropdown = !!activeCat && activeCat.children.length > 0;

  if (categories.length === 0) return null;

  const toggleMobile = (id: string) => {
    setMobileExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative z-40">
      {/* Desktop category bar */}
      <nav
        className="hidden border-b border-slate-700 bg-slate-800 md:block"
        onMouseLeave={() => setActiveId(null)}
      >
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              onMouseEnter={() =>
                setActiveId(cat.children.length > 0 ? cat.id : null)
              }
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeId === cat.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Mega-menu dropdown */}
        {showDropdown && activeCat && (
          <div
            className="absolute left-0 right-0 border-b border-[var(--border)] bg-[var(--background)] shadow-lg"
            onMouseEnter={() => setActiveId(activeCat.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8 xl:grid-cols-4">
              {activeCat.children.map((sub) => (
                <div key={sub.id}>
                  <Link
                    href={`/category/${sub.slug}`}
                    className="mb-2 block text-sm font-semibold text-[var(--accent)] hover:underline"
                  >
                    {sub.name}
                  </Link>
                  {sub.children.length > 0 && (
                    <ul className="space-y-1.5">
                      {sub.children.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/category/${item.slug}`}
                            className="block text-sm text-[var(--foreground)]/70 transition-colors hover:text-[var(--accent)]"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile category toggle */}
      <div className="border-b border-[var(--border)] md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between bg-slate-800 px-4 py-3 text-sm font-medium text-white"
        >
          <span className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Browse Categories
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto bg-[var(--background)]">
            {categories.map((cat) => (
              <MobileCategoryRow
                key={cat.id}
                node={cat}
                depth={0}
                expanded={mobileExpanded}
                onToggle={toggleMobile}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileCategoryRowProps {
  node: CategoryNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: () => void;
}

function MobileCategoryRow({
  node,
  depth,
  expanded,
  onToggle,
  onNavigate,
}: MobileCategoryRowProps) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const paddingLeft = `${1 + depth * 0.75}rem`;

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <div className="flex items-center">
        <Link
          href={`/category/${node.slug}`}
          onClick={onNavigate}
          className="flex-1 py-3 pr-3 text-sm font-medium text-[var(--foreground)]"
          style={{ paddingLeft }}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={isOpen ? "Collapse" : "Expand"}
            onClick={() => onToggle(node.id)}
            className="px-4 py-3 text-[var(--foreground)]/60"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="bg-[var(--muted)]">
          {node.children.map((child) => (
            <MobileCategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
