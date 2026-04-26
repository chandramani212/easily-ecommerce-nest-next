import Link from "next/link";

import { apiFetch } from "../../../../lib/api";
import type { Order } from "../../../../lib/types";
import { formatDateTime, formatMoney } from "../../../../lib/format";
import { PageHeader } from "../../../../components/page-header";
import { StatusBadge } from "../../../../components/status-badge";
import { OrderStatusEditor } from "./order-status-editor";
import { DEMO_ORDER_IDS } from "../../../../lib/demo-api";
import { IS_DEMO } from "../../../../lib/demo";

export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  return DEMO_ORDER_IDS.map((id) => ({ id }));
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await apiFetch<Order>(`/orders/${id}`);
  const address = order.shippingAddress as Record<string, string> | null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <Link
            href="/orders"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm hover:bg-[var(--admin-muted)]"
          >
            ← Back
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--admin-fg)]/50">
            Status
          </p>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge value={order.status} />
            <OrderStatusEditor id={order.id} status={order.status} />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--admin-fg)]/50">
            Customer
          </p>
          {order.customer ? (
            <>
              <Link
                href={`/customers/${order.customer.id}`}
                className="mt-1 block font-medium hover:text-[var(--admin-accent)]"
              >
                {order.customer.firstName} {order.customer.lastName}
              </Link>
              <p className="text-sm text-[var(--admin-fg)]/70">
                {order.customer.email}
              </p>
              {order.customer.company && (
                <p className="text-sm text-[var(--admin-fg)]/70">
                  {order.customer.company}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[var(--admin-fg)]/50">—</p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--admin-fg)]/50">
            Shipping Address
          </p>
          {address ? (
            <div className="mt-1 text-sm text-[var(--admin-fg)]/80">
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {[address.city, address.state, address.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {address.country && <p>{address.country}</p>}
            </div>
          ) : (
            <p className="mt-1 text-[var(--admin-fg)]/50">—</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h3 className="font-semibold">Line Items</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Unit Price</th>
              <th className="px-4 py-3 text-right font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr
                key={item.id}
                className="border-t border-[var(--admin-border)]"
              >
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatMoney(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-[var(--admin-border)] bg-[var(--admin-muted)]/30 text-sm">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-[var(--admin-fg)]/70">
                Subtotal
              </td>
              <td className="px-4 py-2 text-right">{formatMoney(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-[var(--admin-fg)]/70">
                Shipping
              </td>
              <td className="px-4 py-2 text-right">{formatMoney(order.shipping)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-[var(--admin-fg)]/70">
                Tax
              </td>
              <td className="px-4 py-2 text-right">{formatMoney(order.tax)}</td>
            </tr>
            <tr className="border-t border-[var(--admin-border)] text-base font-semibold">
              <td colSpan={3} className="px-4 py-3 text-right">
                Total
              </td>
              <td className="px-4 py-3 text-right">{formatMoney(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
