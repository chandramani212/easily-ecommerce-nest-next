import { apiFetchSafe } from "../../lib/api";
import { StatCard } from "../../components/stat-card";

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
    </div>
  );
}
