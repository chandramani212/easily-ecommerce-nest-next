import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "ui:bg-indigo-600 ui:text-white hover:ui:bg-indigo-700 active:ui:bg-indigo-800",
  secondary:
    "ui:bg-neutral-200 ui:text-neutral-900 hover:ui:bg-neutral-300 active:ui:bg-neutral-400 dark:ui:bg-neutral-700 dark:ui:text-neutral-100 dark:hover:ui:bg-neutral-600",
  outline:
    "ui:border ui:border-neutral-300 ui:bg-transparent ui:text-neutral-900 hover:ui:bg-neutral-100 dark:ui:border-neutral-600 dark:ui:text-neutral-100 dark:hover:ui:bg-neutral-800",
  ghost:
    "ui:bg-transparent ui:text-neutral-900 hover:ui:bg-neutral-100 dark:ui:text-neutral-100 dark:hover:ui:bg-neutral-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "ui:px-3 ui:py-1.5 ui:text-sm",
  md: "ui:px-4 ui:py-2 ui:text-sm",
  lg: "ui:px-6 ui:py-3 ui:text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ui:inline-flex ui:items-center ui:justify-center ui:rounded-lg ui:font-medium ui:transition-colors ui:focus-visible:outline-2 ui:focus-visible:outline-offset-2 ui:focus-visible:outline-indigo-500 ui:disabled:pointer-events-none ui:disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
