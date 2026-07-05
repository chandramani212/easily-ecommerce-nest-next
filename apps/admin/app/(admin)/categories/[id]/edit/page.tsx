import { apiFetch } from "../../../../../lib/api";
import type { Category } from "../../../../../lib/types";
import { PageHeader } from "../../../../../components/page-header";
import { CategoryForm } from "../../category-form";
import { DEMO_CATEGORY_IDS } from "../../../../../lib/demo-api";
import { IS_DEMO } from "../../../../../lib/demo";

export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  return DEMO_CATEGORY_IDS.map((id) => ({ id }));
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    apiFetch<Category>(`/categories/${id}`),
    apiFetch<Category[]>("/categories"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title={`Edit: ${category.name}`}
        description="Update category details"
      />
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
