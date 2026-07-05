import Link from "next/link";

import { apiFetch } from "../../../lib/api";
import type { Category } from "../../../lib/types";
import { PageHeader } from "../../../components/page-header";
import { DataTable, type Column } from "../../../components/data-table";
import { buildCategoryTree } from "../../../lib/category-tree";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";

export default async function CategoriesPage() {
  const categories = await apiFetch<Category[]>("/categories");

  // Render parent-first with depth so the table mirrors the category hierarchy.
  const tree = buildCategoryTree(categories);
  const depthById = new Map(tree.map((t) => [t.category.id, t.depth]));
  const rows = tree.map((t) => t.category);

  // Group ids by parent (in API/sortOrder order) so each row knows its siblings
  // for up/down reordering.
  const siblingsByParent = new Map<string, string[]>();
  for (const c of categories) {
    const key = c.parentId ?? "__root__";
    const arr = siblingsByParent.get(key) ?? [];
    arr.push(c.id);
    siblingsByParent.set(key, arr);
  }

  const columns: Column<Category>[] = [
    {
      header: "Order",
      className: "w-px",
      accessor: (row) => (
        <ReorderButtons
          id={row.id}
          siblingIds={siblingsByParent.get(row.parentId ?? "__root__") ?? [row.id]}
        />
      ),
    },
    {
      header: "Name",
      accessor: (row) => {
        const depth = depthById.get(row.id) ?? 0;
        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 1.25}rem` }}
          >
            {depth > 0 && (
              <span className="text-[var(--admin-fg)]/30">↳</span>
            )}
            {row.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.image}
                alt=""
                className="h-7 w-7 rounded object-cover"
              />
            )}
            <Link
              href={`/categories/${row.id}/edit`}
              className="font-medium text-[var(--admin-fg)] hover:text-[var(--admin-accent)]"
            >
              {row.name}
            </Link>
          </div>
        );
      },
    },
    {
      header: "Slug",
      accessor: (row) => (
        <span className="font-mono text-xs text-[var(--admin-fg)]/70">
          {row.slug}
        </span>
      ),
    },
    {
      header: "Parent",
      accessor: (row) =>
        row.parent?.name ?? (
          <span className="text-[var(--admin-fg)]/30">—</span>
        ),
    },
    {
      header: "Products",
      accessor: (row) => (
        <span className="text-[var(--admin-fg)]/70">
          {row._count?.products ?? 0}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.active === false
              ? "bg-gray-100 text-gray-600"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {row.active === false ? "Inactive" : "Active"}
        </span>
      ),
    },
    {
      header: "",
      className: "text-right",
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/categories/${row.id}/edit`}
            className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)]"
          >
            Edit
          </Link>
          <DeleteButton id={row.id} />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        title="Categories"
        description="Organize products for easier browsing"
        actions={
          <Link
            href="/categories/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Category
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        emptyText="No categories yet. Click Add Category to create one."
      />
    </div>
  );
}
