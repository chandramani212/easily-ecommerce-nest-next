"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi } from "../../../lib/client-api";
import { MediaPicker } from "../../../components/media-picker";
import type { Category, MediaAsset } from "../../../lib/types";

function buildTree(categories: Category[], excludeId?: string) {
  const pool = excludeId ? categories.filter((c) => c.id !== excludeId) : categories;
  const roots = pool.filter((c) => !c.parentId);
  const result: { category: Category; depth: number }[] = [];
  for (const root of roots) {
    result.push({ category: root, depth: 0 });
    for (const child of pool.filter((c) => c.parentId === root.id)) {
      result.push({ category: child, depth: 1 });
    }
  }
  // orphans whose parent was excluded
  const placed = new Set(result.map((r) => r.category.id));
  for (const c of pool) {
    if (!placed.has(c.id)) result.push({ category: c, depth: 0 });
  }
  return result;
}

function CategorySelect({
  value,
  onChange,
  categories,
  excludeId,
  placeholder = "No parent (top-level)",
}: {
  value: string;
  onChange: (id: string) => void;
  categories: Category[];
  excludeId?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tree = buildTree(categories, excludeId);
  const selected = categories.find((c) => c.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
      >
        <span className={selected ? "" : "text-[var(--admin-fg)]/40"}>
          {selected?.name ?? placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-40">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-lg">
          <ul className="max-h-56 overflow-y-auto divide-y divide-[var(--admin-border)]">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--admin-muted)] ${!value ? "bg-[var(--admin-accent)]/5 font-medium" : "text-[var(--admin-fg)]/50"}`}
              >
                {placeholder}
              </button>
            </li>
            {tree.map(({ category: c, depth }) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className={`flex w-full items-center gap-1 py-2 pr-3 text-left text-sm hover:bg-[var(--admin-muted)] ${value === c.id ? "bg-[var(--admin-accent)]/5 font-medium" : ""}`}
                  style={{ paddingLeft: depth === 0 ? "0.75rem" : "1.75rem" }}
                >
                  {depth > 0 && <span className="text-[var(--admin-fg)]/30">↳</span>}
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ImageButton({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-8 w-8 rounded object-cover" />
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm hover:bg-[var(--admin-muted)]"
      >
        {value ? "Change image" : "Choose image"}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-[var(--admin-fg)]/50 hover:text-red-600"
        >
          Remove
        </button>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(assets: MediaAsset[]) => {
          if (assets[0]) onChange(assets[0].url);
          setOpen(false);
        }}
      />
    </div>
  );
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initial);

  // Add-form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState("");

  // Edit state
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editParentId, setEditParentId] = useState("");

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
          description: description || undefined,
          image: image || undefined,
          parentId: parentId || undefined,
        }),
      });
      setName("");
      setSlug("");
      setDescription("");
      setImage("");
      setParentId("");
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  function startEdit(c: Category) {
    setEditing(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditDescription(c.description ?? "");
    setEditImage(c.image ?? "");
    setEditParentId(c.parentId ?? "");
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await clientApi(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          description: editDescription || undefined,
          image: editImage || undefined,
          parentId: editParentId || null,
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
      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
      >
        <h3 className="mb-3 font-semibold">Add Category</h3>
        <div className="grid gap-3 sm:grid-cols-2">
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
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--admin-accent)]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)] sm:col-span-2"
          />
          <CategorySelect
            value={parentId}
            onChange={setParentId}
            categories={categories}
          />
          <div className="flex items-center">
            <ImageButton value={image} onChange={setImage} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="ml-auto rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add Category
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-muted)]/60 text-xs uppercase tracking-wide text-[var(--admin-fg)]/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Parent</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Products</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-[var(--admin-fg)]/50"
                >
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t border-[var(--admin-border)]">
                  {editing === c.id ? (
                    <>
                      <td className="px-4 py-2" colSpan={4}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                            className="rounded border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-sm"
                          />
                          <input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            placeholder="Slug"
                            className="rounded border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 font-mono text-sm"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="rounded border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-sm sm:col-span-2"
                          />
                          <CategorySelect
                            value={editParentId}
                            onChange={setEditParentId}
                            categories={categories}
                            excludeId={editing ?? undefined}
                          />
                          <div className="flex items-center">
                            <ImageButton value={editImage} onChange={setEditImage} />
                          </div>
                        </div>
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
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {c.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.image}
                              alt=""
                              className="h-7 w-7 rounded object-cover"
                            />
                          )}
                          {c.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--admin-fg)]/70">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-fg)]/70">
                        {c.parent?.name ?? <span className="text-[var(--admin-fg)]/30">—</span>}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-[var(--admin-fg)]/70">
                        <span className="line-clamp-2 text-xs">
                          {c.description || <span className="text-[var(--admin-fg)]/30">—</span>}
                        </span>
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
