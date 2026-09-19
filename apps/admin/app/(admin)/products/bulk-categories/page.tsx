import { redirect } from "next/navigation";

/** The category-only sheet is covered by the full product import/export. */
export default function BulkCategoriesPage() {
  redirect("/products/bulk");
}
