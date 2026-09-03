import { Header } from "../../components/header";
import { CategoryBar } from "../../components/category-bar";
import { Breadcrumb } from "../../components/breadcrumb";
import { SectionHeading } from "../../components/section-heading";
import { CategoryShowcaseCard } from "../../components/category-showcase-card";
import { Footer } from "../../components/footer";
import { apiFetchSafe } from "../../lib/api";
import {
  categoryIconPath,
  normalizeImageUrl,
  sizedImage,
} from "../../lib/adapt";
import type { ApiCategory, ProductsResponse } from "../../lib/types";

export const metadata = {
  title: "Shop All Categories - Easily Branded",
  description:
    "Browse every product category at Easily Branded, from pens and drinkware to bags, apparel, and tech.",
};

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

/**
 * Resolve a representative image for a top-level category. Roots carry no
 * products of their own (products live on leaves), so with no admin-assigned
 * image we fall back to a product photo from the most-stocked descendant
 * leaves — "contain" so the product isn't cropped like a banner.
 */
async function representativeImage(
  category: ApiCategory,
  descendants: ApiCategory[],
): Promise<{ url?: string; fit: "cover" | "contain" }> {
  if (category.image)
    return {
      url: sizedImage(normalizeImageUrl(category.image), "normal"),
      fit: "cover",
    };
  const candidates = descendants
    .filter((k) => (k._count?.products ?? 0) > 0)
    .sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0))
    .slice(0, 3);
  for (const child of candidates) {
    const res = await apiFetchSafe<ProductsResponse>(
      `/products?active=true&pageSize=3&categoryId=${encodeURIComponent(child.id)}`,
    );
    const img = res?.items
      ?.map((p) => p.images?.[0])
      .find((u): u is string => !!u);
    if (img)
      return {
        url: sizedImage(normalizeImageUrl(img), "normal"),
        fit: "contain",
      };
  }
  return { fit: "cover" };
}

/**
 * The storefront's "Shop" destination: every top-level category as a tile.
 * The home page shows only the first six of these; this page shows them all.
 */
export default async function CategoryIndexPage() {
  const allCategories =
    (await apiFetchSafe<ApiCategory[]>("/categories?active=true")) ?? [];

  const childrenByParentId = new Map<string, ApiCategory[]>();
  for (const c of allCategories) {
    if (!c.parentId) continue;
    const list = childrenByParentId.get(c.parentId) ?? [];
    list.push(c);
    childrenByParentId.set(c.parentId, list);
  }
  const descendantsOf = (id: string): ApiCategory[] => {
    const kids = childrenByParentId.get(id) ?? [];
    return kids.flatMap((k) => [k, ...descendantsOf(k.id)]);
  };

  const parentCategories = await Promise.all(
    allCategories
      .filter((c) => !c.parentId)
      .map(async (c) => {
        const descendants = descendantsOf(c.id);
        // Roots hold no products directly, so total across the whole subtree.
        const count = descendants.reduce(
          (n, k) => n + (k._count?.products ?? 0),
          c._count?.products ?? 0,
        );
        const rep = await representativeImage(c, descendants);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          count,
          image: rep.url,
          imageFit: rep.fit,
        };
      }),
  );

  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Shop by Category"
          subtitle="Browse our full range and pick a category to explore"
        />
        {parentCategories.length === 0 ? (
          <p className="text-center text-sm text-[var(--foreground)]/50">
            Categories are not available right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {parentCategories.map((cat) => (
              <CategoryShowcaseCard
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                count={cat.count}
                image={cat.image}
                imageFit={cat.imageFit}
                icon={categoryIcon(cat.slug)}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
