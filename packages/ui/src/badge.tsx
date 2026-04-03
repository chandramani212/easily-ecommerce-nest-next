import { type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "ui:bg-neutral-100 ui:text-neutral-700 dark:ui:bg-neutral-700 dark:ui:text-neutral-300",
  success:
    "ui:bg-emerald-50 ui:text-emerald-700 dark:ui:bg-emerald-900/30 dark:ui:text-emerald-400",
  danger:
    "ui:bg-red-50 ui:text-red-700 dark:ui:bg-red-900/30 dark:ui:text-red-400",
  warning:
    "ui:bg-amber-50 ui:text-amber-700 dark:ui:bg-amber-900/30 dark:ui:text-amber-400",
  info: "ui:bg-blue-50 ui:text-blue-700 dark:ui:bg-blue-900/30 dark:ui:text-blue-400",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`ui:inline-flex ui:items-center ui:gap-1 ui:rounded-full ui:px-2.5 ui:py-0.5 ui:text-xs ui:font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
