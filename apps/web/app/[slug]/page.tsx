import { notFound } from "next/navigation";
import { Header } from "../../components/header";
import { CategoryBar } from "../../components/category-bar";
import { Breadcrumb } from "../../components/breadcrumb";
import { Footer } from "../../components/footer";
import { CategoryCard } from "../../components/category-card";
import { CategoryHero } from "../../components/category-hero";
import { CategoryListing, type ServerListing } from "./category-listing";
import {
  PER_PAGE,
  parseListingQuery,
  type RawSearchParams,
  type SortKey,
} from "./listing-params";
import { ProductDetail } from "./product-detail";
import { apiFetchSafe, API_URL } from "../../lib/api";
import { resolveColor } from "../../lib/color";
import {
  adaptCategory,
  adaptProductForCard,
  adaptProductForDetail,
  categoryIconPath,
  normalizeImageUrl,
  sizedImage,
} from "../../lib/adapt";
import type {
  ApiCategory,
  ApiProduct,
  ProductsResponse,
  StorefrontFacets,
  StorefrontResponse,
} from "../../lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

/** Category pages list cheapest first unless the shopper picks another order. */
const CATEGORY_DEFAULT_SORT: SortKey = "price-asc";

const NO_FACETS: StorefrontFacets = {
  count: 0,
  priceMin: 0,
  priceMax: 0,
  brands: [],
  colors: [],
};

/**
 * One page of a leaf category's products — filtered, sorted and paged by the
 * API from the URL (`?page=&sort=&min=&max=&brand=&color=`) — plus the
 * category-wide filter options. Only the visible page is fetched and rendered.
 */
async function loadCategoryListing(categoryId: string, sp: RawSearchParams) {
  const query = parseListingQuery(sp, CATEGORY_DEFAULT_SORT);
  const facetsReq = apiFetchSafe<StorefrontFacets>(
    `/products/storefront/facets?categoryId=${encodeURIComponent(categoryId)}`,
  ).then((f) => f ?? NO_FACETS);

  const fetchPage = (page: number, colorNames: string[]) => {
    const p = new URLSearchParams({
      categoryId,
      page: String(page),
      pageSize: String(PER_PAGE),
      sort: query.sort,
    });
    if (query.minPrice !== undefined) p.set("minPrice", String(query.minPrice));
    if (query.maxPrice !== undefined) p.set("maxPrice", String(query.maxPrice));
    for (const b of query.brands) p.append("brand", b);
    for (const c of colorNames) p.append("color", c);
    return apiFetchSafe<StorefrontResponse>(`/products/storefront?${p}`);
  };

  let facets: StorefrontFacets;
  let res: StorefrontResponse | null;
  let colorNames: string[] = [];
  if (query.colors.length) {
    // Chips carry color-family labels ("Blue"); the API matches raw color
    // names, so expand the selected families from the facet list first.
    facets = await facetsReq;
    colorNames = facets.colors
      .map((c) => c.value)
      .filter((v) => query.colors.includes(resolveColor(v).label));
    if (!colorNames.length) colorNames = query.colors.map((c) => c.toLowerCase());
    res = await fetchPage(query.page, colorNames);
  } else {
    [facets, res] = await Promise.all([facetsReq, fetchPage(query.page, [])]);
  }

  // Past the last page (stale link, or filters shrank the results): show the
  // last page rather than an empty one.
  if (res && res.total > 0 && query.page > res.pageCount) {
    query.page = res.pageCount;
    res = await fetchPage(query.page, colorNames);
  }

  const server: ServerListing = {
    query,
    total: res?.total ?? 0,
    pageCount: res?.pageCount ?? 1,
    facets,
  };
  return { products: (res?.items ?? []).map(adaptProductForCard), server };
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
      title: `${category.name} - Easily Branded`,
      description: category.description ?? undefined,
    };
  }

  const p = await resolveProduct(slug);
  if (!p) return { title: "Not found - Easily Branded" };
  const title = p.metaTitle || `${p.name} - Easily Branded`;
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

export default async function SlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  // Resolve categories first; a category slug wins over a product slug.
  const categories = (await apiFetchSafe<ApiCategory[]>("/categories?active=true")) ?? [];
  const category = categories.find((c) => c.slug === slug);

  if (category) {
    // Keep the admin-defined order (API returns categories by sortOrder).
    const subcategoriesRaw = categories.filter(
      (c) => c.parentId === category.id,
    );

    // Products live on leaf categories, so a mid-level subcategory's image and
    // product count must be aggregated from its descendant leaves.
    const childrenByParentId = new Map<string, ApiCategory[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      const list = childrenByParentId.get(c.parentId) ?? [];
      list.push(c);
      childrenByParentId.set(c.parentId, list);
    }
    const descendantsOf = (id: string): ApiCategory[] => {
      const kids = childrenByParentId.get(id) ?? [];
      return kids.flatMap((k) => [k, ...descendantsOf(k.id)]);
    };

    // For subcategory tiles with no admin-assigned image, fall back to the first
    // available product image in the subcategory or its descendant leaves so
    // cards aren't blank. Fetches run in parallel and only for tiles actually
    // missing an image (uses the existing /products endpoint — no new API route).
    const subcategoryCards = await Promise.all(
      subcategoriesRaw.map(async (rawSub) => {
        const sub = adaptCategory(rawSub);
        // Aggregate the product count across the subcategory and its descendants.
        const descendants = descendantsOf(rawSub.id);
        const count = descendants.reduce(
          (n, k) => n + (k._count?.products ?? 0),
          rawSub._count?.products ?? 0,
        );
        // Admin-assigned category image: fills the tile frame (cover).
        if (sub.image) return { ...sub, count, imageFit: "cover" as const };
        // Product-image fallback: try the most-stocked leaves (the subcategory
        // itself if it's a leaf, otherwise its descendants).
        const pool = [rawSub, ...descendants]
          .filter((k) => (k._count?.products ?? 0) > 0)
          .sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0))
          .slice(0, 3);
        for (const c of pool) {
          const res = await apiFetchSafe<ProductsResponse>(
            `/products?active=true&pageSize=3&categoryId=${encodeURIComponent(
              c.id,
            )}`,
          );
          const firstImage = res?.items
            ?.map((p) => p.images?.[0])
            .find((u): u is string => !!u);
          // Show the whole product (contain), so it isn't cropped like a banner.
          if (firstImage) {
            return {
              ...sub,
              count,
              image: sizedImage(normalizeImageUrl(firstImage), "normal"),
              imageFit: "contain" as const,
            };
          }
        }
        return { ...sub, count, imageFit: "cover" as const };
      }),
    );

    // Walk the full ancestor chain (root → immediate parent), not just one level,
    // so deep categories show every parent in the breadcrumb.
    const ancestors = categoryChain(categories, category.parentId ?? undefined);

    const breadcrumb = [
      { label: "Home", href: "/" },
      ...ancestors,
      { label: category.name },
    ];

    // Leaf category: products are paged by the API, one page per request.
    const listing =
      subcategoryCards.length === 0
        ? await loadCategoryListing(category.id, await searchParams)
        : null;

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

        {subcategoryCards.length > 0 ? (
          // Parent category: show its subcategories as tiles instead of products.
          <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="mt-1 text-sm text-[var(--foreground)]/50">
              Browse subcategories
            </p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {subcategoryCards.map((sub) => (
                <CategoryCard
                  key={sub.id}
                  name={sub.name}
                  slug={sub.slug}
                  count={sub.count}
                  image={sub.image}
                  imageFit={sub.imageFit}
                  layout="tile"
                  icon={categoryIcon(sub.slug)}
                />
              ))}
            </div>
          </section>
        ) : (
          listing && (
            <CategoryListing
              title={category.name}
              defaultSort={CATEGORY_DEFAULT_SORT}
              products={listing.products}
              server={listing.server}
            />
          )
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
