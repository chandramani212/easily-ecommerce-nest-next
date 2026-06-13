import Link from "next/link";

import { apiFetch, apiFetchSafe } from "../../../../lib/api";
import { PageHeader } from "../../../../components/page-header";
import type {
  Supplier,
  SupplierProductsResponse,
} from "../../../../lib/types";
import {
  pickParam as p,
  resolveSearchParams,
  type SearchParamsRecord as SP,
} from "../../../../lib/search-params";
import { SourceProducts } from "../../sources/[id]/source-products";

const ORIGIN_LABEL: Record<string, string> = {
  MANUAL: "Manually entered",
  FEED: "Captured from import feed",
};

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await resolveSearchParams(searchParams);

  const supplier = await apiFetch<Supplier>(`/suppliers/${id}`);

  const productsPage = Math.max(1, Number(p(sp, "productsPage") ?? "1"));
  const productsSkip = (productsPage - 1) * 20;
  const productsData = await apiFetchSafe<SupplierProductsResponse>(
    `/suppliers/${id}/products?take=20&skip=${productsSkip}`,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title={supplier.name}
        description={
          supplier.source
            ? `Supplied through ${supplier.source.name}`
            : undefined
        }
        actions={
          supplier.source ? (
            <Link
              href={`/sources/${supplier.source.id}`}
              className="rounded-lg border border-[var(--admin-border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              View source
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ContactCard supplier={supplier} />
        <MetaCard supplier={supplier} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--admin-fg)]/80">
          Products from this supplier
        </h2>
        <SourceProducts
          data={productsData ?? { total: 0, items: [] }}
          page={productsPage}
          pageSize={20}
        />
      </div>
    </div>
  );
}

function ContactCard({ supplier }: { supplier: Supplier }) {
  const rows: { label: string; value?: string | null; href?: string }[] = [
    { label: "Phone", value: supplier.phone },
    { label: "Alternate phone", value: supplier.altPhone },
    { label: "Toll-free", value: supplier.tollFree },
    {
      label: "Website",
      value: supplier.website,
      href: supplier.website ?? undefined,
    },
  ];
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-fg)]/50">
        Contact details
      </h3>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-[var(--admin-fg)]/60">{r.label}</dt>
            <dd className="text-sm font-medium text-[var(--admin-fg)]">
              {r.value ? (
                r.href ? (
                  <a
                    href={r.href.startsWith("http") ? r.href : `https://${r.href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--admin-accent)] hover:underline"
                  >
                    {r.value}
                  </a>
                ) : (
                  r.value
                )
              ) : (
                <span className="text-[var(--admin-fg)]/30">—</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MetaCard({ supplier }: { supplier: Supplier }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-fg)]/50">
        About
      </h3>
      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--admin-fg)]/60">Origin</dt>
          <dd className="text-sm font-medium text-[var(--admin-fg)]">
            {ORIGIN_LABEL[supplier.origin] ?? supplier.origin}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--admin-fg)]/60">Products</dt>
          <dd className="text-sm font-medium text-[var(--admin-fg)]">
            {supplier.productCount ?? 0}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-[var(--admin-fg)]/60">Status</dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                supplier.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {supplier.active ? "Active" : "Inactive"}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
