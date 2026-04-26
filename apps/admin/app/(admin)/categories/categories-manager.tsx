"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi } from "../../../lib/client-api";
import type { Category } from "../../../lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editImage, setEditImage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await clientApi<Category[]>("/categories");
    setCategories(data);
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await clientApi("/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          image: image || undefined,
        }),
      });
      setName("");
      setSlug("");
      setImage("");
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  function startEdit(c: Category) {
    setEditing(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditImage(c.image ?? "");
  }

  async function saveEdit(id: string) {
    try {
      await clientApi(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          image: editImage || undefined,
        }),
      });
      setEditing(null);
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await clientApi(`/categories/${id}`, { method: "DELETE" });
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
      >
        <h3 className="mb-3 font-semibold">Add Category</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="Name *"
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug *"
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Image URL (optional)"
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Products</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-[var(--admin-fg)]/50"
                >
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[var(--admin-border)]"
                >
                  {editing === c.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="w-full rounded border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-sm font-mono"
                        />
                      </td>
                      <td className="px-4 py-2 text-[var(--admin-fg)]/60">
                        {c._count?.products ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveEdit(c.id)}
                            className="rounded-md bg-[var(--admin-accent)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--admin-fg)]/70">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-fg)]/60">
                        {c._count?.products ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs hover:bg-[var(--admin-muted)]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCategory(c.id)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
