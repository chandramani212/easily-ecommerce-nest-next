import { Header } from "../../components/header";
import { CategoryBar } from "../../components/category-bar";
import { Breadcrumb } from "../../components/breadcrumb";
import { Footer } from "../../components/footer";
import { CategoryListing } from "../[slug]/category-listing";
import { apiFetchSafe } from "../../lib/api";
import { adaptProductForCard } from "../../lib/adapt";
import type { ProductsResponse } from "../../lib/types";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  return {
    title: term
      ? `Search: ${term} — Easily Branded`
      : "Search — Easily Branded",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  const products = term
    ? (
        (
          await apiFetchSafe<ProductsResponse>(
            `/products?active=true&pageSize=100&q=${encodeURIComponent(term)}`,
          )
        )?.items ?? []
      ).map(adaptProductForCard)
    : [];

  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: term ? `Search: ${term}` : "Search" },
          ]}
        />
      </div>

      {term ? (
        <CategoryListing
          title={`Search results for "${term}"`}
          products={products}
        />
      ) : (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
              className="mb-4 text-[var(--foreground)]/20"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="font-medium text-[var(--foreground)]/50">
              Search our products
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]/30">
              Type a product name or SKU in the search box above.
            </p>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
