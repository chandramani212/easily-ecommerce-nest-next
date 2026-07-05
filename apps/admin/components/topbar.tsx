"use client";

import { useState } from "react";
import { Avatar } from "@repo/ui/avatar";
import { useTheme } from "./theme-provider";
import { logout } from "../lib/client-api";

interface TopBarProps {
  onMenuToggle: () => void;
  user?: { name: string; email: string; role: string };
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function TopBar({ onMenuToggle, user }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name ?? "Admin";
  const displayEmail = user?.email ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-4 sm:px-6">
      <button
        aria-label="Toggle sidebar"
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-[var(--admin-fg)]/60 transition-colors hover:bg-[var(--admin-muted)] lg:hidden"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Global search hidden for now — non-functional placeholder.
      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-fg)]/40"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search or type command..."
          className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] py-2 pl-10 pr-4 text-sm text-[var(--admin-fg)] outline-none transition-colors placeholder:text-[var(--admin-fg)]/40 focus:border-[var(--admin-accent)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--admin-border)] bg-[var(--admin-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--admin-fg)]/40">
          ⌘K
        </kbd>
      </div>
      */}
      {/* Spacer pushes the action buttons to the right now that search is hidden. */}
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--admin-fg)]/60 transition-colors hover:bg-[var(--admin-muted)]"
        >
          {theme === "light" ? (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>

        <button
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-[var(--admin-fg)]/60 transition-colors hover:bg-[var(--admin-muted)]"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--admin-muted)]"
          >
            <Avatar initials={initialsFor(displayName)} size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="mt-0.5 text-xs text-[var(--admin-fg)]/50">{displayEmail}</p>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="hidden opacity-40 sm:block"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-lg">
                <div className="border-b border-[var(--admin-border)] px-3 py-2">
                  <p className="text-xs text-[var(--admin-fg)]/60">Signed in as</p>
                  <p className="truncate text-sm font-medium">{displayEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--admin-fg)] transition-colors hover:bg-[var(--admin-muted)]"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
