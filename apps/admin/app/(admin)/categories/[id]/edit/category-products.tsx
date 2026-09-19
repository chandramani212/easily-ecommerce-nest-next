"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../../../lib/client-api";
import { Pager } from "../../../../../components/pagination";
import { ProductPicker } from "../../../../../components/product-picker";
import { SearchInput } from "../../../../../components/search-input";
import type { Pagination, Product } from "../../../../../lib/types";

/**
 * Paged list of the products linked to a category, with add (via the product
 * picker) and per-row remove. Paging and search live in the URL (`page`, `q`)
 * and are resolved server-side by the edit page.
 */
export function CategoryProducts({
  categoryId,
  data,
}: {
  categoryId: string;
  data: Pagination<Product>;
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof DemoReadOnlyError || err instanceof Error
          ? err.message
          : "Update failed",
      );
    } finally {
      setBusy(false);
    }
  }

  const add = (picks: Product[]) =>
    picks.length &&
    run(() =>
      clientApi(`/categories/${categoryId}/products`, {
        method: "POST",
        body: JSON.stringify({ productIds: picks.map((p) => p.id) }),
      }),
    );

  const remove = (p: Product) => {
    if (!confirm(`Remove "${p.name}" from this category?`)) return;
    void run(() =>
      clientApi(`/categories/${categoryId}/products/${p.id}`, {
        method: "DELETE",
      }),
    );
  };

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Products in this category</h2>
          <p className="text-xs text-[var(--admin-fg)]/60">
            {data.total} product{data.total === 1 ? "" : "s"} assigned
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          + Add products
        </button>
      </div>

      <div className="mb-3 flex">
        <SearchInput placeholder="Search this category…" />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--admin-fg)]/50">
          No products found.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
          {data.items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--admin-muted)]">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-[var(--admin-fg)]/40">—</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${p.id}/edit`}
                  className="block truncate font-medium hover:text-[var(--admin-accent)]"
                >
                  {p.name}
                </Link>
                <p className="truncate font-mono text-xs text-[var(--admin-fg)]/60">
                  {p.sku}
                  {!p.active && " · inactive"}
                </p>
              </div>
              <span className="shrink-0 tabular-nums">
                ${Number(p.sellingPrice).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => remove(p)}
                disabled={busy}
                className="rounded-md border border-[var(--admin-border)] px-2 py-1 text-xs hover:bg-[var(--admin-muted)] disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <Pager page={data.page} pageCount={data.pageCount} total={data.total} />

      <ProductPicker
        title="Add products to category"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={data.items.map((p) => p.id)}
        onSelect={(picks) => void add(picks)}
      />
    </div>
  );
}
