import { apiFetch } from "../../../../lib/api";
import type { Category } from "../../../../lib/types";
import { PageHeader } from "../../../../components/page-header";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  const categories = await apiFetch<Category[]>("/categories");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Add Category"
        description="Create a new product category"
      />
      <CategoryForm categories={categories} />
    </div>
  );
}
