import Link from "next/link";

import { formatDateTime, formatMoney } from "../../../../lib/format";
import { Pager } from "../../../../components/pagination";
import type { SupplierProductLinkEntry } from "../../../../lib/types";

export function SupplierProducts({
  data,
  page,
  pageSize,
}: {
  data: { total: number; items: SupplierProductLinkEntry[] };
  page: number;
  pageSize: number;
}) {
  const pageCount = Math.ceil(data.total / pageSize);
  if (data.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--admin-border)] p-10 text-center">
        <p className="text-sm text-[var(--admin-fg)]/70">
          No products have been imported from this supplier yet.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--admin-fg)]/60">
        {data.total} product{data.total === 1 ? "" : "s"} linked
      </p>

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Supplier ID</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Last seen</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr
                key={row.externalId}
                className="border-t border-[var(--admin-border)]"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/products/${row.product.id}/edit`}
                    className="hover:text-[var(--admin-accent)]"
                  >
                    {row.product.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--admin-fg)]/70">
                  {row.product.sku}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--admin-fg)]/70">
                  {row.externalId}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(row.product.sellingPrice)}
                </td>
                <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                  {formatDateTime(row.lastSeenAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.product.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {row.product.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} pageCount={pageCount} total={data.total} paramName="productsPage" />
    </div>
  );
}
