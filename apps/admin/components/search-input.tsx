"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
}

export function SearchInput(props: SearchInputProps) {
  return (
    <Suspense fallback={<SearchInputFallback placeholder={props.placeholder} />}>
      <SearchInputInner {...props} />
    </Suspense>
  );
}

function SearchInputFallback({ placeholder }: { placeholder?: string }) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <input
        type="text"
        disabled
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] py-2 pl-10 pr-4 text-sm text-[var(--admin-fg)]/40 outline-none"
      />
    </div>
  );
}

function SearchInputInner({
  placeholder = "Search…",
  paramName = "q",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramName, value);
    else params.delete(paramName);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative flex-1 sm:max-w-xs">
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] py-2 pl-10 pr-4 text-sm text-[var(--admin-fg)] outline-none transition-colors placeholder:text-[var(--admin-fg)]/40 focus:border-[var(--admin-accent)]"
      />
    </form>
  );
}
