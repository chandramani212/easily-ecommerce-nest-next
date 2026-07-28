import { apiFetch, apiFetchSafe } from "../../../lib/api";
import type { AdminUser, UserRole } from "../../../lib/types";
import { formatDate } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { UsersManager } from "./users-manager";

interface MeResponse {
  role: UserRole;
}

export default async function UsersPage() {
  const [users, me] = await Promise.all([
    apiFetch<AdminUser[]>("/users"),
    apiFetchSafe<MeResponse>("/auth/me"),
  ]);
  const formatted = users.map((u) => ({
    ...u,
    createdAtFormatted: formatDate(u.createdAt),
  }));
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Admin Users"
        description="Manage who can access the admin panel"
      />
      <UsersManager initial={formatted} viewerRole={me?.role ?? "STAFF"} />
    </div>
  );
}
