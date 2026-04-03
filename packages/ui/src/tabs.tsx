"use client";

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`ui:inline-flex ui:gap-1 ui:rounded-lg ui:bg-neutral-100 ui:p-1 dark:ui:bg-neutral-800 ${className}`}
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`ui:rounded-md ui:px-3.5 ui:py-1.5 ui:text-sm ui:font-medium ui:transition-colors ${
            activeTab === item.key
              ? "ui:bg-white ui:text-neutral-900 ui:shadow-sm dark:ui:bg-neutral-700 dark:ui:text-neutral-100"
              : "ui:text-neutral-500 hover:ui:text-neutral-700 dark:ui:text-neutral-400 dark:hover:ui:text-neutral-200"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
