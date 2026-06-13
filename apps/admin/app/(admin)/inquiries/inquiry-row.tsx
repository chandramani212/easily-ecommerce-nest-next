"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "../../../lib/client-api";
import type { Inquiry, InquiryStatus } from "../../../lib/types";
import { StatusBadge } from "../../../components/status-badge";

const STATUSES: InquiryStatus[] = ["NEW", "IN_PROGRESS", "CLOSED"];

export function InquiryRow({
  inquiry,
  formattedDate,
}: {
  inquiry: Inquiry;
  formattedDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: InquiryStatus) {
    setSaving(true);
    try {
      await clientApi(`/inquiries/${inquiry.id}/status`, {
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
          <p className="font-medium">{inquiry.name}</p>
          <p className="text-xs text-[var(--admin-fg)]/60">{inquiry.email}</p>
          {inquiry.company && (
            <p className="text-xs text-[var(--admin-fg)]/60">
              {inquiry.company}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <p className="font-medium">{inquiry.inquiryType}</p>
          {inquiry.productName && (
            <div className="mt-1 flex items-center gap-2">
              {inquiry.productImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inquiry.productImage}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--admin-fg)]/70">
                  {inquiry.productName}
                </p>
                {inquiry.productSku && (
                  <p className="font-mono text-[10px] text-[var(--admin-fg)]/50">
                    {inquiry.productSku}
                  </p>
                )}
              </div>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              (inquiry.organic ?? true)
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
            title={(inquiry.organic ?? true) ? "Organic" : "Other (paid / campaign)"}
          >
            {inquiry.source ?? "direct"}
          </span>
          {inquiry.provider && (
            <p className="mt-0.5 text-xs capitalize text-[var(--admin-fg)]/60">
              {inquiry.provider}
            </p>
          )}
        </td>
        <td className="max-w-xs truncate px-4 py-3 text-[var(--admin-fg)]/80">
          {inquiry.message || "—"}
        </td>
        <td className="px-4 py-3">
          <StatusBadge value={status} />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <select
              disabled={saving}
              value={status}
              onChange={(e) => changeStatus(e.target.value as InquiryStatus)}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-xs outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              onClick={() => setOpen(!open)}
              className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs hover:bg-[var(--admin-muted)]"
            >
              {open ? "Hide" : "View"}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-[var(--admin-border)] bg-[var(--admin-muted)]/30">
          <td colSpan={7} className="px-4 py-4">
            {inquiry.productName && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-3">
                {inquiry.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inquiry.productImage}
                    alt={inquiry.productName}
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[var(--admin-muted)] text-[10px] text-[var(--admin-fg)]/40">
                    No image
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-[var(--admin-fg)]/50">
                    Product enquired about
                  </p>
                  <p className="mt-0.5 font-medium">{inquiry.productName}</p>
                  {inquiry.productSku && (
                    <p className="font-mono text-xs text-[var(--admin-fg)]/60">
                      SKU: {inquiry.productSku}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Phone" value={inquiry.phone ?? "—"} />
              <Field label="Quantity" value={inquiry.quantity ?? "—"} />
              <Field label="Company" value={inquiry.company ?? "—"} />
              <Field label="Received" value={formattedDate} />
              <Field
                label="Lead source"
                value={`${inquiry.source ?? "direct"}${(inquiry.organic ?? true) ? " (organic)" : " (other)"}`}
              />
              <Field label="Platform" value={inquiry.provider || "—"} />
              <Field label="Campaign" value={inquiry.campaign || "—"} />
              <Field label="Referrer" value={inquiry.referrer || "—"} />
            </div>
            {inquiry.message && (
              <div className="mt-3">
                <p className="text-xs font-medium uppercase text-[var(--admin-fg)]/50">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--admin-fg)]">
                  {inquiry.message}
                </p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-[var(--admin-fg)]/50">
        {label}
      </p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
