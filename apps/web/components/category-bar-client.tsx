"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CategoryNode } from "../lib/adapt";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

  // Anchor the dropdown under the hovered item, but clamp it so a wide
  // mega-menu never overflows the right edge of the viewport.
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!activeCat || activeCat.children.length === 0) {
      setDropdownLeft(null);
      return;
    }
    const nav = navRef.current;
    const dropdown = dropdownRef.current;
    const item = itemRefs.current.get(activeCat.id);
    if (!nav || !dropdown || !item) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const gutter = 8;
    const maxLeft = navRect.width - dropdown.offsetWidth - gutter;
    // Align to the item's left, then pull back if it would run off-screen.
    let left = itemRect.left - navRect.left;
    left = Math.min(left, Math.max(gutter, maxLeft));
    left = Math.max(gutter, left);
    setDropdownLeft(left);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

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
        ref={navRef}
        className="relative hidden border-b border-slate-700 bg-slate-800 md:block"
        onMouseLeave={() => setActiveId(null)}
      >
        <div className="mx-auto flex max-w-7xl items-center overflow-x-auto px-4 sm:px-6 lg:px-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              ref={(el) => {
                if (el) itemRefs.current.set(cat.id, el);
                else itemRefs.current.delete(cat.id);
              }}
              href={`/${cat.slug}`}
              onMouseEnter={() =>
                setActiveId(cat.children.length > 0 ? cat.id : null)
              }
              className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors ${
                activeId === cat.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Dropdown anchored under the hovered item, clamped to the viewport */}
        {activeCat && activeCat.children.length > 0 && (
          <div
            ref={dropdownRef}
            style={{ left: dropdownLeft ?? 0 }}
            className={`absolute top-full z-50 rounded-b-md border border-[var(--border)] bg-[var(--background)] shadow-lg ${
              dropdownLeft === null ? "invisible" : ""
            }`}
            onMouseEnter={() => setActiveId(activeCat.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <div className="flex w-max max-w-[min(63rem,92vw)] flex-wrap justify-start gap-5 p-5">
              {activeCat.children.map((sub) => (
                <div key={sub.id} className="w-44">
                  <Link
                    href={`/${sub.slug}`}
                    className="mb-2 block text-sm font-semibold text-[var(--accent)] hover:underline"
                  >
                    {sub.name}
                  </Link>
                  {sub.children.length > 0 && (
                    <ul className="space-y-1.5">
                      {sub.children.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/${item.slug}`}
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
          href={`/${node.slug}`}
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
