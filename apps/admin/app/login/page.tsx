import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in \u2013 Easily Admin",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Easily"
            className="mx-auto mb-4 h-10 w-auto"
          />
          <h1 className="text-2xl font-bold text-[var(--admin-fg)]">
            Easily Admin
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-fg)]/60">
            Sign in to manage your store
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 shadow-sm sm:p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
