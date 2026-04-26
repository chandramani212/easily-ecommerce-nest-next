import { apiFetch } from "../../../lib/api";
import type { Settings } from "../../../lib/types";
import { PageHeader } from "../../../components/page-header";
import { SettingsForm } from "./settings-form";


export default async function SettingsPage() {
  const settings = await apiFetch<Settings>("/settings");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Settings"
        description="Configure SMTP for outgoing email notifications"
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
