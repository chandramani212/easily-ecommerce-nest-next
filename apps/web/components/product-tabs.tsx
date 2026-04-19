"use client";

import { useState } from "react";

interface TabContent {
  label: string;
  content: React.ReactNode;
}

interface ProductTabsProps {
  tabs: TabContent[];
}

export function ProductTabs({ tabs }: ProductTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              i === active
                ? "text-[var(--accent)]"
                : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
            {i === active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>
      <div className="py-6 text-sm leading-relaxed text-[var(--foreground)]/70">
        {tabs[active]?.content}
      </div>
    </div>
  );
}
