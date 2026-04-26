"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "../../../lib/client-api";
import type { Category, Product } from "../../../lib/types";

interface Props {
  product?: Product;
  categories: Category[];
}

interface TierRow {
  minQuantity: string;
  price: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState((product?.images ?? []).join("\n"));
  const [tiers, setTiers] = useState<TierRow[]>(
    product?.tierPrices?.map((t) => ({
      minQuantity: String(t.minQuantity),
      price: String(t.price),
    })) ?? [],
  );

  function addTier() {
    setTiers([...tiers, { minQuantity: "", price: "" }]);
  }

  function updateTier(i: number, key: keyof TierRow, value: string) {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  }

  function removeTier(i: number) {
    setTiers(tiers.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      sku,
      description,
      basePrice: parseFloat(basePrice) || 0,
      images: images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      active,
      categoryId: categoryId || undefined,
      tierPrices: tiers
        .filter((t) => t.minQuantity && t.price)
        .map((t) => ({
          minQuantity: parseInt(t.minQuantity, 10),
          price: parseFloat(t.price),
        })),
    };

    try {
      if (product) {
        await clientApi(`/products/${product.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await clientApi(`/products`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h3 className="mb-4 font-semibold">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name *</Label>
            <Input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!product && (!slug || slug === slugify(name)))
                  setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <Label>SKU *</Label>
            <Input
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
            />
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--admin-border)]"
              />
              Active (visible on storefront)
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h3 className="mb-4 font-semibold">Pricing</h3>
        <div className="mb-4 max-w-xs">
          <Label>Base Price *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-4">
          <div>
            <h4 className="text-sm font-semibold">Tier Pricing</h4>
            <p className="text-xs text-[var(--admin-fg)]/60">
              Volume-based pricing. Minimum quantity triggers the tier price.
            </p>
          </div>
          <button
            type="button"
            onClick={addTier}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
          >
            + Add Tier
          </button>
        </div>

        {tiers.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--admin-fg)]/50">
            No tier pricing. Only the base price will apply.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tier.minQuantity}
                    onChange={(e) => updateTier(i, "minQuantity", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(i, "price", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h3 className="mb-1 font-semibold">Images</h3>
        <p className="mb-3 text-xs text-[var(--admin-fg)]/60">
          One URL per line.
        </p>
        <textarea
          rows={4}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 font-mono text-xs text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--admin-fg)]/70">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
    />
  );
}
