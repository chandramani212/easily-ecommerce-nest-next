import { redirect } from "next/navigation";

import { apiFetchSafe } from "../../lib/api";
import { DEMO_USER, IS_DEMO } from "../../lib/demo";
import { AdminShell } from "./admin-shell";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (IS_DEMO) {
    return <AdminShell user={DEMO_USER}>{children}</AdminShell>;
  }

  const me = await apiFetchSafe<MeResponse>("/auth/me");
  if (!me) {
    redirect("/login");
  }
  return <AdminShell user={me}>{children}</AdminShell>;
}
