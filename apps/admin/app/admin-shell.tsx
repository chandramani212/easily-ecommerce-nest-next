"use client";

import { useState, type ReactNode } from "react";
import { ThemeProvider } from "../components/theme-provider";
import { Sidebar } from "../components/sidebar";
import { TopBar } from "../components/topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[280px]">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </ThemeProvider>
  );
}
