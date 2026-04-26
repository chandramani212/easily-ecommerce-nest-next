import Link from "next/link";

import { apiFetch } from "../../../../lib/api";
import type { Customer } from "../../../../lib/types";
import { formatDate, formatMoney } from "../../../../lib/format";
import { PageHeader } from "../../../../components/page-header";
import { StatusBadge } from "../../../../components/status-badge";
import { DEMO_CUSTOMER_IDS } from "../../../../lib/demo-api";
import { IS_DEMO } from "../../../../lib/demo";

export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  return DEMO_CUSTOMER_IDS.map((id) => ({ id }));
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await apiFetch<Customer>(`/customers/${id}`);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        actions={
          <Link
            href="/customers"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm hover:bg-[var(--admin-muted)]"
          >
            ← Back
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Email" value={customer.email} />
        <InfoCard label="Phone" value={customer.phone ?? "—"} />
        <InfoCard label="Company" value={customer.company ?? "—"} />
        <InfoCard label="Joined" value={formatDate(customer.createdAt)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h3 className="font-semibold">Orders</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Items</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {!customer.orders || customer.orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-[var(--admin-fg)]/50"
                >
                  No orders yet.
                </td>
              </tr>
            ) : (
              customer.orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-[var(--admin-border)]"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/orders/${order.id}`}
                      className="hover:text-[var(--admin-accent)]"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="px-4 py-3">{order.items?.length ?? 0}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(order.total)}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--admin-fg)]/50">
        {label}
      </p>
      <p className="mt-1 font-medium text-[var(--admin-fg)]">{value}</p>
    </div>
  );
}
