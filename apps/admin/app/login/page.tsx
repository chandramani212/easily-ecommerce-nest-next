import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in – ShopEase Admin",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--admin-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-accent)]">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--admin-fg)]">
            ShopEase Admin
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

        <p className="mt-6 text-center text-xs text-[var(--admin-fg)]/50">
          Default: admin@shopease.local / admin123
        </p>
      </div>
    </div>
  );
}
