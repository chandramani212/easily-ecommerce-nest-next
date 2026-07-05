import { apiFetchSafe } from "../lib/api";
import { buildCategoryTree } from "../lib/adapt";
import type { ApiCategory } from "../lib/types";
import { CategoryBarClient } from "./category-bar-client";

export async function CategoryBar() {
  const categories = await apiFetchSafe<ApiCategory[]>("/categories?active=true");
  const tree = buildCategoryTree(categories ?? []);
  return <CategoryBarClient categories={tree} />;
}
