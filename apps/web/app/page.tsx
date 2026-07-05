import { Header } from "../components/header";
import { HeroBanner } from "../components/hero-banner";
import { TrustBadges } from "../components/trust-badges";
import { CategoryBar } from "../components/category-bar";
import { SectionHeading } from "../components/section-heading";
import { CategoryCard } from "../components/category-card";
import { BestSellersTabs } from "../components/best-sellers-tabs";
import { TestimonialCarousel } from "../components/testimonial-carousel";
import { Footer } from "../components/footer";
import { apiFetchSafe } from "../lib/api";
import {
  adaptCategory,
  adaptProductForCard,
  categoryIconPath,
} from "../lib/adapt";
import type { ApiCategory, ProductsResponse } from "../lib/types";
import { getPage, pageMetadata, type HomeContent } from "../lib/pages";

export async function generateMetadata() {
  const page = await getPage("home");
  return pageMetadata(page, {
    title: "Easily Branded — Custom Branded Products",
    description:
      "Custom branded T-shirts, stationery, drinkware, and more.",
  });
}

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Verified Buyer",
    initials: "SJ",
    rating: 5,
    quote:
      "Absolutely love the quality of products! Fast shipping and the packaging was perfect. Will definitely be ordering again.",
  },
  {
    name: "Michael Chen",
    role: "Regular Customer",
    initials: "MC",
    rating: 5,
    quote:
      "The customer service is outstanding. Had a question about my order and they responded within minutes. Highly recommend!",
  },
  {
    name: "Emily Rodriguez",
    role: "Verified Buyer",
    initials: "ER",
    rating: 4,
    quote:
      "Great selection and competitive prices. The website is easy to navigate and checkout was seamless. Very impressed.",
  },
  {
    name: "David Park",
    role: "Regular Customer",
    initials: "DP",
    rating: 5,
    quote:
      "Been shopping here for over a year now. Consistent quality and the rewards program is a great bonus. Wouldn't shop anywhere else.",
  },
  {
    name: "Lisa Thompson",
    role: "Verified Buyer",
    initials: "LT",
    rating: 5,
    quote:
      "The return process was so easy and hassle-free. They really stand behind their products. Excellent experience overall.",
  },
  {
    name: "James Wilson",
    role: "Verified Buyer",
    initials: "JW",
    rating: 4,
    quote:
      "Wide variety of products and very competitive pricing. The website makes it easy to compare and find exactly what you need.",
  },
];

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

export default async function Page() {
  const [categoriesRaw, popularRaw, homePage] = await Promise.all([
    apiFetchSafe<ApiCategory[]>("/categories?active=true"),
    apiFetchSafe<ProductsResponse>("/products?active=true&pageSize=8"),
    getPage<HomeContent>("home"),
  ]);
  const hero = homePage?.content?.hero;
  const contentBlock = homePage?.content?.content;

  const rootCategories = (categoriesRaw ?? [])
    .filter((c) => !c.parentId)
    .slice(0, 6)
    .map(adaptCategory);

  const topCategoriesForTabs = (categoriesRaw ?? [])
    .filter((c) => !c.parentId)
    .slice(0, 2);

  const popularProducts = (popularRaw?.items ?? []).map(adaptProductForCard);

  const categoryTabs = await Promise.all(
    topCategoriesForTabs.map(async (c) => {
      const res = await apiFetchSafe<ProductsResponse>(
        `/products?active=true&pageSize=8&categoryId=${encodeURIComponent(c.id)}`,
      );
      return {
        key: c.slug,
        label: c.name,
        products: (res?.items ?? []).map(adaptProductForCard),
      };
    }),
  );

  const tabs = [
    {
      key: "popular",
      label: "Most Popular",
      products: popularProducts,
    },
    ...categoryTabs.filter((t) => t.products.length > 0),
  ];

  return (
    <>
      <Header />
      <CategoryBar />
      <HeroBanner slides={hero?.slides} autoPlayMs={hero?.autoPlayMs} />
      <TrustBadges />

      <section className="bg-[var(--muted)]" id="categories">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Shop by Category"
            subtitle="Find what you need across our wide range of categories"
          />
          {rootCategories.length === 0 ? (
            <p className="text-center text-sm text-[var(--foreground)]/50">
              Categories are not available right now.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {rootCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  count={cat.count}
                  icon={categoryIcon(cat.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white" id="shop">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title="Best Sellers"
            subtitle="Our most popular products loved by customers"
          />
          <BestSellersTabs tabs={tabs} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Real reviews from real customers"
        />
        <TestimonialCarousel items={TESTIMONIALS} />
      </section>

      {/* Backend-editable content block — only rendered when data is present. */}
      {contentBlock && (contentBlock.heading || contentBlock.body) && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            {contentBlock.heading && (
              <h2 className="text-center text-2xl font-bold sm:text-3xl">
                {contentBlock.heading}
              </h2>
            )}
            {contentBlock.body && (
              <div
                className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 text-[15px] leading-relaxed text-[var(--foreground)]/75 shadow-sm sm:p-8 [&_a]:text-[var(--accent)] [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--foreground)] [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_li]:mt-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-[var(--foreground)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_*:first-child]:mt-0"
                dangerouslySetInnerHTML={{ __html: contentBlock.body }}
              />
            )}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
