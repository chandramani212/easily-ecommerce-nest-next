import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { CategoryBar } from "../../components/category-bar";
import { Breadcrumb } from "../../components/breadcrumb";
import { Footer } from "../../components/footer";
import { CategoryCard } from "../../components/category-card";
import { CategoryHero } from "../../components/category-hero";
import { CategoryListing } from "./category-listing";
import { ProductDetail } from "./product-detail";
import { apiFetchSafe, API_URL } from "../../lib/api";
import {
  adaptCategory,
  adaptProductForCard,
  adaptProductForDetail,
  categoryIconPath,
  normalizeImageUrl,
} from "../../lib/adapt";
import type { ApiCategory, ApiProduct, ProductsResponse } from "../../lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function categoryIcon(slug: string) {
  return (
    <svg
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={categoryIconPath(slug)} />
    </svg>
  );
}

async function resolveProduct(slug: string): Promise<ApiProduct | null> {
  const bySlug = await apiFetchSafe<ApiProduct>(
    `/products/by-slug/${encodeURIComponent(slug)}`,
  );
  if (bySlug) return bySlug;

  return apiFetchSafe<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
}

/**
 * Walk a category's ancestry into ordered breadcrumb items (root → leaf),
 * each linking to its clean `/${slug}` page. Guards against cyclic parentIds.
 */
function categoryChain(
  categories: ApiCategory[],
  startId: string | undefined,
): { label: string; href?: string }[] {
  if (!startId) return [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: { label: string; href?: string }[] = [];
  const seen = new Set<string>();
  let cur = byId.get(startId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift({ label: cur.name, href: `/${cur.slug}` });
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

function absoluteImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API_URL}${url}`;
  return url;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const categories = await apiFetchSafe<ApiCategory[]>("/categories?active=true");
  const category = (categories ?? []).find((c) => c.slug === slug);
  if (category) {
    return {
      title: `${category.name} — Easily Branded`,
      description: category.description ?? undefined,
    };
  }

  const p = await resolveProduct(slug);
  if (!p) return { title: "Not found — Easily Branded" };
  const title = p.metaTitle || `${p.name} — Easily Branded`;
  const description =
    p.metaDescription ||
    p.shortDescription ||
    p.description?.slice(0, 160) ||
    undefined;
  const img = absoluteImage(p.ogImage || p.images?.[0]);
  return {
    title,
    description,
    keywords: p.keywords || undefined,
    openGraph: {
      title,
      description,
      images: img ? [img] : undefined,
    },
  };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Resolve categories first; a category slug wins over a product slug.
  const categories = (await apiFetchSafe<ApiCategory[]>("/categories?active=true")) ?? [];
  const category = categories.find((c) => c.slug === slug);

  if (category) {
    // Keep the admin-defined order (API returns categories by sortOrder).
    const subcategories = categories
      .filter((c) => c.parentId === category.id)
      .map(adaptCategory);

    // Walk the full ancestor chain (root → immediate parent), not just one level,
    // so deep categories show every parent in the breadcrumb.
    const ancestors = categoryChain(categories, category.parentId ?? undefined);

    const breadcrumb = [
      { label: "Home", href: "/" },
      ...ancestors,
      { label: category.name },
    ];

    return (
      <>
        <Header />
        <CategoryBar />

        {/* Compact hero header: banner image when set, gradient fallback otherwise. */}
        <CategoryHero
          name={category.name}
          bannerImage={
            category.bannerImage
              ? normalizeImageUrl(category.bannerImage)
              : null
          }
        />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumb} />
        </div>

        {subcategories.length > 0 ? (
          // Parent category: show its subcategories as tiles instead of products.
          <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="mt-1 text-sm text-[var(--foreground)]/50">
              Browse subcategories
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subcategories.map((sub) => (
                <CategoryCard
                  key={sub.id}
                  name={sub.name}
                  slug={sub.slug}
                  count={sub.count}
                  image={sub.image}
                  layout="tile"
                  icon={categoryIcon(sub.slug)}
                />
              ))}
            </div>
          </section>
        ) : (
          <CategoryListing
            title={category.name}
            products={(
              (
                await apiFetchSafe<ProductsResponse>(
                  `/products?active=true&pageSize=100&categoryId=${encodeURIComponent(
                    category.id,
                  )}`,
                )
              )?.items ?? []
            ).map(adaptProductForCard)}
          />
        )}

        {/* Backend-editable content — only rendered when text is present. */}
        {category.content && (
          <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div
              className="text-[15px] leading-relaxed text-[var(--foreground)]/75 [&_a]:text-[var(--accent)] [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--foreground)] [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_li]:mt-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-[var(--foreground)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_*:first-child]:mt-0"
              dangerouslySetInnerHTML={{ __html: category.content }}
            />
          </div>
        )}

        <Footer />
      </>
    );
  }

  // Not a category — try to resolve it as a product.
  const raw = await resolveProduct(slug);
  if (!raw) notFound();

  const product = adaptProductForDetail(raw);

  // Build the breadcrumb from the full categories list so the product's parent
  // category chain (root → leaf) is shown, not just its immediate category.
  const productBreadcrumb = [
    { label: "Home", href: "/" },
    ...categoryChain(categories, raw.categories[0]?.id),
    { label: product.name },
  ];

  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={productBreadcrumb} />
      </div>

      <ProductDetail product={product} />

      <Footer />
    </>
  );
}
