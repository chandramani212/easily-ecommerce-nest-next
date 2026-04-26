import { apiFetch } from "../../../lib/api";
import type { AdminUser } from "../../../lib/types";
import { formatDate } from "../../../lib/format";
import { PageHeader } from "../../../components/page-header";
import { UsersManager } from "./users-manager";


export default async function UsersPage() {
  const users = await apiFetch<AdminUser[]>("/users");
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
      <UsersManager initial={formatted} />
    </div>
  );
}
