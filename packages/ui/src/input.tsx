import { type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export function Input({ label, icon, className = "", ...props }: InputProps) {
  return (
    <div className="ui:flex ui:flex-col ui:gap-1.5">
      {label && (
        <label className="ui:text-sm ui:font-medium ui:text-neutral-700 dark:ui:text-neutral-300">
          {label}
        </label>
      )}
      <div className="ui:relative ui:flex ui:items-center">
        {icon && (
          <span className="ui:pointer-events-none ui:absolute ui:left-3 ui:text-neutral-400 dark:ui:text-neutral-500">
            {icon}
          </span>
        )}
        <input
          className={`ui:w-full ui:rounded-lg ui:border ui:border-neutral-200 ui:bg-white ui:px-4 ui:py-2.5 ui:text-sm ui:text-neutral-900 ui:outline-none ui:transition-colors ui:placeholder:text-neutral-400 ui:focus:border-indigo-500 ui:focus:ring-1 ui:focus:ring-indigo-500 dark:ui:border-neutral-700 dark:ui:bg-neutral-800 dark:ui:text-neutral-100 dark:ui:placeholder:text-neutral-500 dark:ui:focus:border-indigo-400 dark:ui:focus:ring-indigo-400 ${icon ? "ui:pl-10" : ""} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
