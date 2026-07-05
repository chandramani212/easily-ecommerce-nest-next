"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CategorySelect } from "../../../components/category-select";
import { MediaPicker } from "../../../components/media-picker";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import type { Category, MediaAsset } from "../../../lib/types";

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
        <img src={value} alt="" className="h-9 w-9 rounded object-cover" />
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--admin-fg)]/60">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

export function CategoryForm({
  category,
  categories,
}: {
  category?: Category;
  categories: Category[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [bannerImage, setBannerImage] = useState(category?.bannerImage ?? "");
  const [content, setContent] = useState(category?.content ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [active, setActive] = useState(category?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      description: description || undefined,
      image: image || undefined,
      bannerImage: bannerImage || undefined,
      content: content || undefined,
      // On edit, send null to clear a parent; on create, omit when empty.
      parentId: parentId || (category ? null : undefined),
      active,
    };

    try {
      if (category) {
        await clientApi(`/categories/${category.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await clientApi(`/categories`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/categories");
      router.refresh();
    } catch (e) {
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode — saving categories is disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                if (!slugTouched) setSlug(slugify(next));
              }}
              placeholder="e.g. Drinkware"
              className={inputClass}
            />
          </Field>
          <Field label="Slug">
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="drinkware"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary shown on category listings (optional)"
                rows={2}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Parent category">
            <CategorySelect
              value={parentId}
              onChange={setParentId}
              categories={categories}
              excludeId={category?.id}
            />
          </Field>
          <Field label="Status">
            <label className="flex cursor-pointer items-center gap-2 py-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-[var(--admin-accent)]"
              />
              <span>
                {active ? "Active" : "Inactive"}
                <span className="ml-1 text-[var(--admin-fg)]/50">
                  — {active ? "shown on the storefront" : "hidden from the storefront"}
                </span>
              </span>
            </label>
          </Field>
          <Field label="Tile image">
            <ImageButton value={image} onChange={setImage} />
          </Field>
          <Field label="Banner image">
            <ImageButton value={bannerImage} onChange={setBannerImage} />
          </Field>
          <div className="sm:col-span-2">
            <RichTextEditor
              label="Page content"
              value={content}
              onChange={setContent}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {error && <p className="mr-auto text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm hover:bg-[var(--admin-muted)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : category ? "Save Changes" : "Add Category"}
        </button>
      </div>
    </form>
  );
}
