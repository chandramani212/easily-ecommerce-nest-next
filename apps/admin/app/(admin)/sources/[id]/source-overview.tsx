import { formatDateTime } from "../../../../lib/format";
import type { Source } from "../../../../lib/types";

const KIND_LABEL: Record<string, string> = {
  REST: "REST API",
  FILE_FEED: "File feed",
};

const AUTH_LABEL: Record<string, string> = {
  NONE: "None",
  API_KEY: "API key",
  BASIC: "Basic",
  BEARER: "Bearer",
  OAUTH2_CLIENT_CREDENTIALS: "OAuth2 (CC)",
};

export function SourceOverview({ source }: { source: Source }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card label="Imports" value={String(source.importCount ?? 0)} />
      <Card label="Linked products" value={String(source.productCount ?? 0)} />
      <Card
        label="Status"
        value={source.active ? "Active" : "Inactive"}
        accent={source.active}
      />

      <div className="lg:col-span-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h3 className="mb-4 font-semibold">Connection</h3>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Source type" value={KIND_LABEL[source.kind] ?? source.kind} />
          <Row label="Auth type" value={AUTH_LABEL[source.authType] ?? source.authType} />
          <Row label="Base URL" value={source.baseUrl ?? "—"} mono />
          <Row
            label="Auth configured"
            value={source.authConfigured ? "Yes" : "No"}
          />
          <Row
            label="Default markup"
            value={
              source.defaultMarkupPct > 0
                ? `${source.defaultMarkupPct.toFixed(2)}%`
                : "—"
            }
          />
          <Row label="Created" value={formatDateTime(source.createdAt)} />
        </dl>
        {source.notes && (
          <div className="mt-5 rounded-lg bg-[var(--admin-muted)]/40 p-3 text-sm">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--admin-fg)]/60">
              Notes
            </span>
            {source.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-fg)]/60">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          accent ? "text-emerald-600" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--admin-fg)]/60">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-[var(--admin-fg)] ${
          mono ? "font-mono break-all" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
