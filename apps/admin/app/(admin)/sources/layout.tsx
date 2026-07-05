import { redirect } from "next/navigation";

import { apiFetchSafe } from "../../../lib/api";
import { IS_DEMO } from "../../../lib/demo";

interface MeResponse {
  role: string;
}

/**
 * The Sources module is restricted to SUPER_ADMIN. The API already enforces
 * this (RolesGuard), but we also redirect non-super-admins here so a direct
 * URL doesn't render an empty, permission-denied page. Skipped in demo mode.
 */
export default async function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!IS_DEMO) {
    const me = await apiFetchSafe<MeResponse>("/auth/me");
    if (!me || me.role !== "SUPER_ADMIN") {
      redirect("/");
    }
  }
  return <>{children}</>;
}
