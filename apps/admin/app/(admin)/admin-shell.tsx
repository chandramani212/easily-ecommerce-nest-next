"use client";

import { useState, type ReactNode } from "react";

import { ThemeProvider } from "../../components/theme-provider";
import { Sidebar } from "../../components/sidebar";
import { TopBar } from "../../components/topbar";
import { IS_DEMO } from "../../lib/demo";

interface AdminShellProps {
  children: ReactNode;
  user: { name: string; email: string; role: string };
}

export function AdminShell({ children, user }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={user.role}
      />
      <div className="lg:pl-[280px]">
        <TopBar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        {IS_DEMO && <DemoBanner />}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </ThemeProvider>
  );
}

function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p>
          <strong className="font-semibold">Demo mode.</strong> This is a static
          UI showcase — data is sample fixtures and write actions (create, edit,
          delete) are disabled.
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-md px-2 py-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
