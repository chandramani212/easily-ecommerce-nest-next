import { type ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`ui:rounded-xl ui:border ui:border-neutral-200 ui:bg-white ui:p-6 ui:shadow-sm dark:ui:border-neutral-700 dark:ui:bg-neutral-900 ${className}`}
    >
      {title && (
        <h3 className="ui:mb-4 ui:text-lg ui:font-semibold">{title}</h3>
      )}
      {children}
    </div>
  );
}
