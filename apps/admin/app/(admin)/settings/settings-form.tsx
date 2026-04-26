"use client";

import { useState } from "react";

import { clientApi } from "../../../lib/client-api";
import type { Settings } from "../../../lib/types";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [smtpHost, setSmtpHost] = useState(initial.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(initial.smtpPort));
  const [smtpUser, setSmtpUser] = useState(initial.smtpUser);
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState(initial.smtpFrom);
  const [smtpSecure, setSmtpSecure] = useState(initial.smtpSecure);
  const [notifyTo, setNotifyTo] = useState(initial.notifyTo);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState(initial.notifyTo || "");
  const [testing, setTesting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        smtpHost,
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser,
        smtpFrom,
        smtpSecure,
        notifyTo,
      };
      if (smtpPass) payload.smtpPass = smtpPass;
      await clientApi("/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage("Settings saved");
      setSmtpPass("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testTo) {
      setMessage("Enter a recipient for the test email");
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const result = await clientApi<{ sent: boolean; reason?: string }>(
        "/settings/test-email",
        {
          method: "POST",
          body: JSON.stringify({ to: testTo }),
        },
      );
      setMessage(
        result.sent
          ? `Test email sent to ${testTo}`
          : `Failed: ${result.reason ?? "unknown"}`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Send failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6"
    >
      <h3 className="font-semibold">SMTP Configuration</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SMTP Host">
          <input
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="smtp.example.com"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <Field label="SMTP Port">
          <input
            type="number"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="587"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <Field label="SMTP User">
          <input
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="username"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <Field
          label={`SMTP Password ${initial.smtpPassSet ? "(••• set)" : ""}`}
        >
          <input
            type="password"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            placeholder={
              initial.smtpPassSet
                ? "Leave blank to keep"
                : "Enter SMTP password"
            }
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <Field label='"From" Address'>
          <input
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            placeholder="no-reply@yourstore.com"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <Field label="Notify To (inquiries + messages)">
          <input
            value={notifyTo}
            onChange={(e) => setNotifyTo(e.target.value)}
            placeholder="you@yourstore.com"
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={smtpSecure}
            onChange={(e) => setSmtpSecure(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--admin-border)]"
          />
          Use secure (TLS) connection
        </label>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div className="border-t border-[var(--admin-border)] pt-4">
        <h3 className="mb-3 font-semibold">Send Test Email</h3>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Send to" className="min-w-[240px] flex-1">
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="test@example.com"
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
            />
          </Field>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-muted)] disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted)]/40 px-3 py-2 text-sm text-[var(--admin-fg)]">
          {message}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--admin-fg)]/70">
        {label}
      </label>
      {children}
    </div>
  );
}
