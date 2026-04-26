import { apiFetch } from "../../../lib/api";
import type { Category } from "../../../lib/types";
import { PageHeader } from "../../../components/page-header";
import { CategoriesManager } from "./categories-manager";


export default async function CategoriesPage() {
  const categories = await apiFetch<Category[]>("/categories");
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Categories"
        description="Organize products for easier browsing"
      />
      <CategoriesManager initial={categories} />
    </div>
  );
}
