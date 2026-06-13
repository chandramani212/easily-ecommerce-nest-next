import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { CategoryBar } from "../../../components/category-bar";
import { Footer } from "../../../components/footer";
import { Breadcrumb } from "../../../components/breadcrumb";
import { ProductDetail } from "./product-detail";
import { apiFetchSafe, API_URL } from "../../../lib/api";
import { adaptProductForDetail } from "../../../lib/adapt";
import type { ApiProduct } from "../../../lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function resolveProduct(idOrSlug: string): Promise<ApiProduct | null> {
  const bySlug = await apiFetchSafe<ApiProduct>(
    `/products/by-slug/${encodeURIComponent(idOrSlug)}`,
  );
  if (bySlug) return bySlug;

  return apiFetchSafe<ApiProduct>(
    `/products/${encodeURIComponent(idOrSlug)}`,
  );
}

function absoluteImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API_URL}${url}`;
  return url;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const p = await resolveProduct(id);
  if (!p) return { title: "Product not found — Easily Branded" };
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

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  const raw = await resolveProduct(id);
  if (!raw) notFound();

  const product = adaptProductForDetail(raw);

  return (
    <>
      <Header />
      <CategoryBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={product.categoryBreadcrumb} />
      </div>

      <ProductDetail product={product} />

      <Footer />
    </>
  );
}
