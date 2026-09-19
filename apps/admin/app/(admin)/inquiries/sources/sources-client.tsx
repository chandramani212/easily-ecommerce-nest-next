"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi } from "../../../../lib/client-api";
import type { LeadSourceDef } from "../../../../lib/types";

const CARD =
  "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5";
const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";
const BTN_PRIMARY =
  "rounded-lg bg-[var(--admin-fg)] px-4 py-2 text-sm font-semibold text-[var(--admin-bg)] transition-opacity hover:opacity-90 disabled:opacity-40";
const INPUT =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

interface FormState {
  key?: string; // set when editing
  system?: boolean;
  label: string;
  organic: boolean;
  hosts: string;
  utmSources: string;
  utmMediums: string;
  priority: string;
  active: boolean;
}

const EMPTY: FormState = {
  label: "",
  organic: true,
  hosts: "",
  utmSources: "",
  utmMediums: "",
  priority: "50",
  active: true,
};

/** One entry per line or comma-separated. */
const toList = (text: string) =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

export function SourcesClient({ initial }: { initial: LeadSourceDef[] }) {
  const router = useRouter();
  const [sources, setSources] = useState(initial);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function reload() {
    setSources(await clientApi<LeadSourceDef[]>("/lead-sources"));
    router.refresh();
  }

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await reload();
      setMessage({ tone: "ok", text: ok });
      return true;
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const body = {
      label: form.label,
      organic: form.organic,
      hosts: toList(form.hosts),
      utmSources: toList(form.utmSources),
      utmMediums: toList(form.utmMediums),
      priority: Number(form.priority) || 50,
      active: form.active,
    };
    const done = await run(
      () =>
        form.key
          ? clientApi(`/lead-sources/${form.key}`, { method: "PATCH", body: JSON.stringify(body) })
          : clientApi("/lead-sources", { method: "POST", body: JSON.stringify(body) }),
      form.key
        ? `Saved "${form.label}". New leads use the updated rules.`
        : `Added "${form.label}". New leads matching it will be tagged from now on.`,
    );
    if (done) setForm(null);
  }

  function edit(s: LeadSourceDef) {
    setMessage(null);
    setForm({
      key: s.key,
      system: s.system,
      label: s.label,
      organic: s.organic,
      hosts: s.hosts.join("\n"),
      utmSources: s.utmSources.join("\n"),
      utmMediums: s.utmMediums.join("\n"),
      priority: String(s.priority),
      active: s.active,
    });
  }

  async function remove(s: LeadSourceDef) {
    if (!confirm(`Delete the "${s.label}" source? Leads already tagged with it keep the tag until you re-apply the rules.`)) return;
    await run(() => clientApi(`/lead-sources/${s.key}`, { method: "DELETE" }), `Deleted "${s.label}".`);
  }

  async function reclassify() {
    if (!confirm("Re-sort every existing lead using the current rules? Leads whose source changes will move to the new bucket.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const r = await clientApi<{ total: number; changed: number }>("/lead-sources/reclassify", {
        method: "POST",
      });
      setMessage({
        tone: "ok",
        text: `Checked ${r.total.toLocaleString()} leads — ${r.changed.toLocaleString()} moved to a different source.`,
      });
      router.refresh();
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Re-sort failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--admin-fg)]/60">
          Sources are checked top to bottom; the first one whose rules match a
          visitor wins. If none match, the lead is <b>Referral</b> (came from
          another site) or <b>Direct</b>.
        </p>
        <div className="flex gap-2">
          <button onClick={reclassify} disabled={busy} className={BTN}>
            Re-apply rules to existing leads
          </button>
          <button
            onClick={() => {
              setMessage(null);
              setForm({ ...EMPTY });
            }}
            disabled={busy}
            className={BTN_PRIMARY}
          >
            + Add source
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/40 bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {form && (
        <form onSubmit={save} className={CARD}>
          <h2 className="text-sm font-semibold">
            {form.key ? `Edit "${form.label || form.key}"` : "New lead source"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--admin-fg)]/60">Name</span>
              <input
                className={INPUT}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. AI Search, Trade Shows"
                required
                maxLength={60}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--admin-fg)]/60">
                Order (lower is checked first)
              </span>
              <input
                className={INPUT}
                type="number"
                min={0}
                max={899}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                disabled={form.system}
              />
            </label>
            <Rules
              label="Referring websites"
              hint="Domain or part of it, one per line — e.g. chatgpt.com, perplexity.ai, facebook."
              value={form.hosts}
              onChange={(v) => setForm({ ...form, hosts: v })}
            />
            <Rules
              label="utm_source values"
              hint="Exact values from campaign links, e.g. chatgpt, newsletter"
              value={form.utmSources}
              onChange={(v) => setForm({ ...form, utmSources: v })}
            />
            <Rules
              label="utm_medium values"
              hint="Exact values, e.g. cpc, email, social"
              value={form.utmMediums}
              onChange={(v) => setForm({ ...form, utmMediums: v })}
            />
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.organic}
                  onChange={(e) => setForm({ ...form, organic: e.target.checked })}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Counts as organic
                  <span className="block text-xs text-[var(--admin-fg)]/50">
                    Untick for paid ads and email campaigns.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  disabled={form.system}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Active
                  <span className="block text-xs text-[var(--admin-fg)]/50">
                    Inactive sources are skipped when sorting new leads.
                  </span>
                </span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={busy} className={BTN_PRIMARY}>
              {busy ? "Saving…" : form.key ? "Save changes" : "Add source"}
            </button>
            <button type="button" onClick={() => setForm(null)} disabled={busy} className={BTN}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Matches</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">
            {sources.map((s) => (
              <tr key={s.key} className={`align-top ${s.active ? "" : "opacity-50"}`}>
                <td className="px-4 py-3 tabular-nums text-[var(--admin-fg)]/60">{s.priority}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{s.label}</p>
                  <p className="font-mono text-xs text-[var(--admin-fg)]/50">{s.key}</p>
                  {!s.active && <p className="text-xs text-amber-600">Inactive</p>}
                </td>
                <td className="max-w-md px-4 py-3">
                  {s.system ? (
                    <span className="text-xs text-[var(--admin-fg)]/60">
                      {s.key === "direct"
                        ? "Fallback: no referrer and no campaign tags"
                        : "Fallback: came from a site no other source matches"}
                      {s.utmMediums.length > 0 && ` · medium ${s.utmMediums.join(", ")}`}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {[
                        ...s.hosts.map((h) => ["site", h]),
                        ...s.utmSources.map((h) => ["source", h]),
                        ...s.utmMediums.map((h) => ["medium", h]),
                      ]
                        .slice(0, 8)
                        .map(([kind, v]) => (
                          <span
                            key={`${kind}-${v}`}
                            className="rounded bg-[var(--admin-muted)] px-1.5 py-0.5 font-mono text-[11px]"
                            title={kind}
                          >
                            {v}
                          </span>
                        ))}
                      {s.hosts.length + s.utmSources.length + s.utmMediums.length > 8 && (
                        <span className="text-xs text-[var(--admin-fg)]/50">
                          +{s.hosts.length + s.utmSources.length + s.utmMediums.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.organic ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.organic ? "Organic" : "Other"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => edit(s)} disabled={busy} className="text-xs font-medium text-[var(--admin-accent)] hover:underline">
                    Edit
                  </button>
                  {!s.system && (
                    <button
                      onClick={() => remove(s)}
                      disabled={busy}
                      className="ml-3 text-xs font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Rules({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs text-[var(--admin-fg)]/60">{label}</span>
      <textarea
        className={`${INPUT} min-h-24 font-mono text-xs`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mt-1 block text-[11px] text-[var(--admin-fg)]/50">{hint}</span>
    </label>
  );
}
