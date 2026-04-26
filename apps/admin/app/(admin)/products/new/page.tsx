import { apiFetch } from "../../../../lib/api";
import type { Category } from "../../../../lib/types";
import { PageHeader } from "../../../../components/page-header";
import { ProductForm } from "../product-form";


export default async function NewProductPage() {
  const categories = await apiFetch<Category[]>("/categories");
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Add Product"
        description="Create a new product with optional tier pricing"
      />
      <ProductForm categories={categories} />
    </div>
  );
}
