import { redirect } from "next/navigation";

import { apiFetchSafe } from "../../lib/api";
import { DEMO_USER, IS_DEMO } from "../../lib/demo";
import { AdminShell } from "./admin-shell";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF" | "SUPER_ADMIN";
}

// Every admin route reads cookies (via apiFetchSafe -> next/headers). That
// import is lazy, so Next can't detect the dynamic access at build time and
// prerenders routes as static, which then throws "static to dynamic at
// runtime" when cookies are read in prod. Force dynamic rendering for the whole
// admin group. (scripts/build-demo.mjs strips this line for the demo build,
// since `output: "export"` can't use force-dynamic.)
export const dynamic = "force-dynamic";

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
