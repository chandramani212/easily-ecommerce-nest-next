import { apiFetch } from "../../../../../lib/api";
import type { Category, Product } from "../../../../../lib/types";
import { PageHeader } from "../../../../../components/page-header";
import { ProductForm } from "../../product-form";
import { DEMO_PRODUCT_IDS } from "../../../../../lib/demo-api";
import { IS_DEMO } from "../../../../../lib/demo";

export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  return DEMO_PRODUCT_IDS.map((id) => ({ id }));
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    apiFetch<Product>(`/products/${id}`),
    apiFetch<Category[]>("/categories"),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={`Edit: ${product.name}`}
        description={`SKU: ${product.sku}`}
      />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
