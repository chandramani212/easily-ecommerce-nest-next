import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { CategoryBar } from "../../../components/category-bar";
import { Breadcrumb } from "../../../components/breadcrumb";
import { Footer } from "../../../components/footer";
import { CategoryListing } from "./category-listing";
import { apiFetchSafe } from "../../../lib/api";
import { adaptProductForCard } from "../../../lib/adapt";
import type { ApiCategory, ProductsResponse } from "../../../lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const categories = await apiFetchSafe<ApiCategory[]>("/categories");
  const category = (categories ?? []).find((c) => c.slug === slug);
  if (!category) notFound();

  const productsRes = await apiFetchSafe<ProductsResponse>(
    `/products?active=true&pageSize=100&categoryId=${encodeURIComponent(category.id)}`,
  );
  const products = (productsRes?.items ?? []).map(adaptProductForCard);

  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/#shop" },
            { label: category.name },
          ]}
        />
      </div>

      <CategoryListing title={category.name} products={products} />

      <Footer />
    </>
  );
}
