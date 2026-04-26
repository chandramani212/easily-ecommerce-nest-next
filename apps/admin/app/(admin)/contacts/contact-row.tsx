"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "../../../lib/client-api";
import type { ContactMessage, ContactStatus } from "../../../lib/types";
import { StatusBadge } from "../../../components/status-badge";

const STATUSES: ContactStatus[] = ["NEW", "READ", "REPLIED"];

export function ContactRow({
  message,
  formattedDate,
}: {
  message: ContactMessage;
  formattedDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ContactStatus>(message.status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: ContactStatus) {
    setSaving(true);
    try {
      await clientApi(`/contact-messages/${message.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <tr className="border-t border-[var(--admin-border)]">
        <td className="px-4 py-3 text-[var(--admin-fg)]/70">{formattedDate}</td>
        <td className="px-4 py-3">
          <p className="font-medium">
            {message.firstName} {message.lastName}
          </p>
          <p className="text-xs text-[var(--admin-fg)]/60">{message.email}</p>
        </td>
        <td className="max-w-sm truncate px-4 py-3">
          {message.subject || <span className="text-[var(--admin-fg)]/40">—</span>}
        </td>
        <td className="px-4 py-3">
          <StatusBadge value={status} />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <select
              disabled={saving}
              value={status}
              onChange={(e) => changeStatus(e.target.value as ContactStatus)}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-xs outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!open && status === "NEW") void changeStatus("READ");
                setOpen(!open);
              }}
              className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs hover:bg-[var(--admin-muted)]"
            >
              {open ? "Hide" : "Read"}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-[var(--admin-border)] bg-[var(--admin-muted)]/30">
          <td colSpan={5} className="px-4 py-4">
            <p className="text-xs font-medium uppercase text-[var(--admin-fg)]/50">
              Message
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--admin-fg)]">
              {message.message}
            </p>
            <a
              href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(
                message.subject || "Your message",
              )}`}
              className="mt-3 inline-block text-sm font-medium text-[var(--admin-accent)] hover:underline"
            >
              Reply by email →
            </a>
          </td>
        </tr>
      )}
    </>
  );
}
