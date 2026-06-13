import { apiFetchSafe } from "../../lib/api";
import { StatCard } from "../../components/stat-card";
import type { LeadSourceReport } from "../../lib/types";

interface Summary {
  products: number;
  customers: number;
  orders: number;
  newInquiries: number;
  newMessages: number;
  revenue: string | number;
}

function formatMoney(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num || 0);
}

export default async function DashboardPage() {
  const summary =
    (await apiFetchSafe<Summary>("/stats/summary")) ?? {
      products: 0,
      customers: 0,
      orders: 0,
      newInquiries: 0,
      newMessages: 0,
      revenue: 0,
    };

  const cards = [
    { label: "Total Revenue", value: formatMoney(summary.revenue), trend: 0 },
    { label: "Orders", value: summary.orders.toLocaleString(), trend: 0 },
    { label: "Customers", value: summary.customers.toLocaleString(), trend: 0 },
    { label: "Products", value: summary.products.toLocaleString(), trend: 0 },
  ];

  const leads = (await apiFetchSafe<LeadSourceReport>(
    "/inquiries/report/source",
  )) ?? { total: 0, organic: 0, other: 0, bySource: [], byProvider: [] };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-[var(--admin-fg)]/60">
          At a glance for your store
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} trend={c.trend} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
          <h3 className="font-semibold">New Inquiries</h3>
          <p className="mt-2 text-3xl font-bold">{summary.newInquiries}</p>
          <p className="mt-1 text-sm text-[var(--admin-fg)]/50">
            Awaiting follow-up
          </p>
          <a
            href="/inquiries"
            className="mt-4 inline-block text-sm font-medium text-[var(--admin-accent)] hover:underline"
          >
            Review inquiries →
          </a>
        </div>
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
          <h3 className="font-semibold">New Messages</h3>
          <p className="mt-2 text-3xl font-bold">{summary.newMessages}</p>
          <p className="mt-1 text-sm text-[var(--admin-fg)]/50">
            Unread contact messages
          </p>
          <a
            href="/contacts"
            className="mt-4 inline-block text-sm font-medium text-[var(--admin-accent)] hover:underline"
          >
            Open inbox →
          </a>
        </div>
      </div>

      <LeadsBySource report={leads} />
    </div>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  organic: "Organic search",
  paid: "Paid / Ads",
  social: "Social",
  referral: "Referral",
  email: "Email",
  direct: "Direct",
};

function LeadsBySource({ report }: { report: LeadSourceReport }) {
  const bySource = report.bySource ?? [];
  const byProvider = report.byProvider ?? [];
  const max = Math.max(1, ...bySource.map((s) => s.count));
  const pct = (n: number) =>
    report.total ? Math.round((n / report.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Leads by source</h3>
        <a
          href="/inquiries"
          className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
        >
          View leads →
        </a>
      </div>

      {report.total === 0 ? (
        <p className="mt-4 text-sm text-[var(--admin-fg)]/50">No leads yet.</p>
      ) : (
        <>
          {/* Organic vs other split */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[var(--admin-muted)]/50 p-3">
              <p className="text-xs text-[var(--admin-fg)]/50">Total leads</p>
              <p className="mt-1 text-2xl font-bold">{report.total}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700/70">Organic</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {report.organic}
                <span className="ml-1 text-sm font-medium">
                  ({pct(report.organic)}%)
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700/70">Other</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {report.other}
                <span className="ml-1 text-sm font-medium">
                  ({pct(report.other)}%)
                </span>
              </p>
            </div>
          </div>

          {/* Per-source bars */}
          <div className="mt-5 space-y-2.5">
            {bySource.map((s) => (
              <a
                key={s.source}
                href={`/inquiries?source=${s.source}`}
                className="block"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 capitalize text-[var(--admin-fg)]/70">
                    {SOURCE_LABELS[s.source] ?? s.source}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--admin-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--admin-accent)]"
                      style={{ width: `${(s.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                    {s.count}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Top platforms (the actual site each lead came from) */}
          {byProvider.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-fg)]/50">
                Top platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {byProvider.map((pv) => (
                  <span
                    key={pv.provider}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs capitalize"
                  >
                    {pv.provider}
                    <span className="font-semibold tabular-nums text-[var(--admin-fg)]/60">
                      {pv.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
