"use client";

import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  // Next.js 16.2: re-fetches from the server (router.refresh + reset in a
  // transition). Preferred over reset() here since admin errors are almost
  // always API data-fetch failures, which plain reset() cannot recover.
  unstable_retry?: () => void;
}

interface ErrorInfo {
  title: string;
  body: string;
  tone: "warning" | "danger";
}

function classify(digest: string | undefined): ErrorInfo {
  const status = digest?.match(/^API_(\d+)$/)?.[1];
  switch (status) {
    case "401":
      return {
        title: "Not signed in",
        body: "Your session has expired. Sign in again to continue.",
        tone: "warning",
      };
    case "403":
      return {
        title: "Insufficient permissions",
        body: "You don't have permission to view this page. Ask an administrator if you need access.",
        tone: "warning",
      };
    case "404":
      return {
        title: "Not found",
        body: "The page or resource you requested doesn't exist or was removed.",
        tone: "warning",
      };
    case "429":
      return {
        title: "Too many requests",
        body: "Please slow down and try again in a moment.",
        tone: "warning",
      };
    case undefined:
      return {
        title: "Something went wrong",
        body: "An unexpected error occurred while loading this page.",
        tone: "danger",
      };
    default:
      return {
        title: `Server error (${status})`,
        body: "The API returned an error. Please try again, and contact support if this keeps happening.",
        tone: "danger",
      };
  }
}

export default function AdminError({ error, reset, unstable_retry }: ErrorProps) {
  const retry = unstable_retry ?? reset;
  const info = classify(error.digest);
  const isDev = process.env.NODE_ENV === "development";

  const tone =
    info.tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 9v2m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">{info.title}</h2>
        <p className="mt-2 text-sm text-[var(--admin-fg)]/70">{info.body}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => retry()}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Back to dashboard
          </Link>
        </div>
        {isDev && error.message && (
          <pre className="mt-6 overflow-auto rounded-lg bg-[var(--admin-muted)] p-3 text-left text-xs text-[var(--admin-fg)]/60">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
