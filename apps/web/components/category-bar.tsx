import { apiFetchSafe } from "../lib/api";
import { buildCategoryTree } from "../lib/adapt";
import type { ApiCategory } from "../lib/types";
import { CategoryBarClient } from "./category-bar-client";

export async function CategoryBar() {
  const categories = await apiFetchSafe<ApiCategory[]>("/categories");
  const tree = buildCategoryTree(categories ?? []);
  return <CategoryBarClient categories={tree} />;
}
