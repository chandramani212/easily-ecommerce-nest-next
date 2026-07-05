"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MediaPicker } from "../../../components/media-picker";
import { ProductPicker } from "../../../components/product-picker";
import { SeoFields, type SeoValue } from "../../../components/seo-fields";
import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import type {
  Category,
  MediaAsset,
  Product,
  ProductAttribute,
  RelatedProductSummary,
  TierPriceType,
} from "../../../lib/types";

interface Props {
  product?: Product;
  categories: Category[];
}

interface TierRow {
  minQuantity: string;
  type: TierPriceType;
  price: string;
}

interface AttrRow {
  name: string;
  value: string;
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
  const externalSku = product?.externalSku ?? "";
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [sellingPrice, setSellingPrice] = useState(
    String(product?.sellingPrice ?? ""),
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [seo, setSeo] = useState<SeoValue>({
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
    ogImage: product?.ogImage ?? "",
    keywords: product?.keywords ?? "",
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories?.map((c) => c.id) ?? [],
  );
  const [related, setRelated] = useState<RelatedProductSummary[]>(
    product?.relatedTo ?? [],
  );
  const [attributes, setAttributes] = useState<AttrRow[]>(
    (product?.attributes ?? []).map((a) => ({ name: a.name, value: a.value })),
  );
  const [tiers, setTiers] = useState<TierRow[]>(
    product?.tierPrices?.map((t) => ({
      minQuantity: String(t.minQuantity),
      type: t.type ?? "FIXED",
      price: String(t.price),
    })) ?? [],
  );

  const [categorySearch, setCategorySearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState<null | "featured" | "gallery">(
    null,
  );
  const [relatedPickerOpen, setRelatedPickerOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Build ordered tree for display when not searching:
  // recursively walk root → children → grandchildren, tracking depth.
  const treeCategories = useMemo(() => {
    const childrenOf = (parentId: string | null) =>
      filteredCategories.filter((c) => (c.parentId ?? null) === parentId);
    const result: { category: Category; depth: number }[] = [];
    const visited = new Set<string>();

    const walk = (parentId: string | null, depth: number) => {
      for (const node of childrenOf(parentId)) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        result.push({ category: node, depth });
        walk(node.id, depth + 1);
      }
    };

    walk(null, 0);

    // Append any orphans (parent not in current list, e.g. filtered out)
    for (const c of filteredCategories) {
      if (!visited.has(c.id)) {
        visited.add(c.id);
        result.push({ category: c, depth: 0 });
      }
    }
    return result;
  }, [filteredCategories]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addTier() {
    setTiers([...tiers, { minQuantity: "", type: "FIXED", price: "" }]);
  }
  function updateTier<K extends keyof TierRow>(
    i: number,
    key: K,
    value: TierRow[K],
  ) {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  }
  function removeTier(i: number) {
    setTiers(tiers.filter((_, idx) => idx !== i));
  }

  /** Resolve a tier row to a per-unit price using the live selling-price input. */
  function resolveTierPreview(t: TierRow): string {
    const price = parseFloat(t.price);
    if (Number.isNaN(price)) return "";
    if (t.type === "PERCENTAGE") {
      const selling = parseFloat(sellingPrice);
      if (Number.isNaN(selling)) return "";
      const pct = Math.max(0, Math.min(100, price));
      const unit = selling * (1 - pct / 100);
      return `= $${unit.toFixed(2)}/unit`;
    }
    return `= $${price.toFixed(2)}/unit`;
  }

  function addAttr() {
    setAttributes([...attributes, { name: "", value: "" }]);
  }
  function updateAttr(i: number, key: keyof AttrRow, value: string) {
    setAttributes(
      attributes.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)),
    );
  }
  function removeAttr(i: number) {
    setAttributes(attributes.filter((_, idx) => idx !== i));
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveFeatured(idx: number) {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      if (picked !== undefined) next.unshift(picked);
      return next;
    });
  }

  function handleMediaSelect(assets: MediaAsset[]) {
    if (pickerOpen === "featured") {
      const url = assets[0]?.url;
      if (url) {
        setImages((prev) => {
          const without = prev.filter((u) => u !== url);
          return [url, ...without];
        });
      }
    } else if (pickerOpen === "gallery") {
      const urls = assets.map((a) => a.url);
      setImages((prev) => {
        const set = new Set(prev);
        urls.forEach((u) => set.add(u));
        return Array.from(set);
      });
    }
  }

  function removeRelated(id: string) {
    setRelated((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const baseNum = parseFloat(basePrice) || 0;
    const sellingNum = sellingPrice
      ? parseFloat(sellingPrice) || 0
      : baseNum;

    const payload = {
      name,
      slug: slug || slugify(name),
      sku,
      shortDescription,
      description,
      basePrice: baseNum,
      sellingPrice: sellingNum,
      images,
      active,
      categoryIds: selectedCategoryIds,
      relatedProductIds: related.map((r) => r.id),
      attributes: attributes
        .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
        .filter((a) => a.name.length > 0),
      tierPrices: tiers
        .filter((t) => t.minQuantity && t.price)
        .map((t) => ({
          minQuantity: parseInt(t.minQuantity, 10),
          type: t.type,
          price: parseFloat(t.price),
        })),
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      ogImage: seo.ogImage || undefined,
      keywords: seo.keywords,
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
      if (e instanceof DemoReadOnlyError) {
        setError("Demo mode — saving products is disabled in the showcase build.");
      } else {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Basic info */}
          <Section title="Basic Information">
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
                <Label>Website SKU</Label>
                <Input
                  value={sku}
                  placeholder="Auto-generated (EB-000123) if left blank"
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              {externalSku && (
                <div>
                  <Label>Supplier SKU</Label>
                  <Input value={externalSku} readOnly disabled />
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>
                  Short Description{" "}
                  <span className="ml-1 text-[10px] font-normal normal-case text-[var(--admin-fg)]/50">
                    ({shortDescription.length}/500)
                  </span>
                </Label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One or two sentences shown in product cards and search results."
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Full Description</Label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]"
                />
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Base Price (MSRP) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-[var(--admin-fg)]/50">
                  List / compare-at price.
                </p>
              </div>
              <div>
                <Label>Selling Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-[var(--admin-fg)]/50">
                  What customers actually pay. Shown next to base price on the storefront.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--admin-border)] pt-4">
              <div>
                <h4 className="text-sm font-semibold">Tier Pricing</h4>
                <p className="text-xs text-[var(--admin-fg)]/60">
                  Volume-based discounts. Minimum quantity triggers the tier price.
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
                No tier pricing — only the selling price will apply.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {tiers.map((tier, i) => {
                  const isPct = tier.type === "PERCENTAGE";
                  const preview = resolveTierPreview(tier);
                  return (
                    <div key={i} className="flex items-end gap-3">
                      <div className="w-24">
                        <Label>Min Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.minQuantity}
                          onChange={(e) =>
                            updateTier(i, "minQuantity", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-40">
                        <Label>Type</Label>
                        <select
                          value={tier.type}
                          onChange={(e) =>
                            updateTier(
                              i,
                              "type",
                              e.target.value as TierPriceType,
                            )
                          }
                          className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)]"
                        >
                          <option value="FIXED">Fixed price</option>
                          <option value="PERCENTAGE">Percentage discount</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label>{isPct ? "Discount %" : "Price"}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step={isPct ? "0.1" : "0.01"}
                            min="0"
                            max={isPct ? 100 : undefined}
                            value={tier.price}
                            onChange={(e) =>
                              updateTier(i, "price", e.target.value)
                            }
                            className="pr-8"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[var(--admin-fg)]/50">
                            {isPct ? "%" : "$"}
                          </span>
                        </div>
                        {preview && (
                          <p className="mt-1 text-[11px] text-[var(--admin-fg)]/55">
                            {preview}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Attributes */}
          <Section
            title="Attributes"
            actions={
              <button
                type="button"
                onClick={addAttr}
                className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
              >
                + Add Attribute
              </button>
            }
          >
            <p className="mb-3 text-xs text-[var(--admin-fg)]/60">
              Free-form name / value pairs (e.g. <em>Material: Cotton</em>,{" "}
              <em>Origin: India</em>). Shown on the storefront product page.
            </p>
            {attributes.length === 0 ? (
              <p className="text-sm text-[var(--admin-fg)]/50">
                No attributes yet.
              </p>
            ) : (
              <div className="space-y-2">
                {attributes.map((attr, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label>Name</Label>
                      <Input
                        placeholder="Material"
                        value={attr.name}
                        onChange={(e) => updateAttr(i, "name", e.target.value)}
                      />
                    </div>
                    <div className="flex-[2]">
                      <Label>Value</Label>
                      <Input
                        placeholder="100% organic cotton"
                        value={attr.value}
                        onChange={(e) => updateAttr(i, "value", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttr(i)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Images */}
          <Section
            title="Images"
            actions={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen("featured")}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
                >
                  Set featured
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen("gallery")}
                  className="rounded-lg bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  + Add from library
                </button>
              </div>
            }
          >
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => setPickerOpen("gallery")}
                className="block w-full rounded-xl border-2 border-dashed border-[var(--admin-border)] py-10 text-center text-sm text-[var(--admin-fg)]/60 hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]"
              >
                Click to choose images from your media library
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {images.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--admin-border)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-[var(--admin-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Featured
                      </span>
                    )}
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => moveFeatured(idx)}
                          className="rounded bg-white/90 px-1.5 py-1 text-[10px] font-medium text-gray-800 shadow"
                          title="Make featured"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="rounded bg-red-500/90 px-1.5 py-1 text-[10px] font-medium text-white shadow"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Linked / related products */}
          <Section
            title="Linked Products"
            actions={
              <button
                type="button"
                onClick={() => setRelatedPickerOpen(true)}
                className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--admin-muted)]"
              >
                + Add related
              </button>
            }
          >
            <p className="mb-3 text-xs text-[var(--admin-fg)]/60">
              Customers shopping this product will also see these as
              recommendations.
            </p>
            {related.length === 0 ? (
              <p className="text-sm text-[var(--admin-fg)]/50">
                No related products selected.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
                {related.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--admin-muted)]">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-[var(--admin-fg)]/40">
                          —
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate font-mono text-xs text-[var(--admin-fg)]/60">
                        {p.sku}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRelated(p.id)}
                      className="rounded-md border border-[var(--admin-border)] px-2 py-1 text-xs hover:bg-[var(--admin-muted)]"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="SEO">
            <SeoFields value={seo} onChange={setSeo} />
          </Section>

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
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Section title="Status">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--admin-border)]"
              />
              Active (visible on storefront)
            </label>
          </Section>

          <Section
            title={`Categories (${selectedCategoryIds.length})`}
            actions={
              selectedCategoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryIds([])}
                  className="text-xs font-medium text-[var(--admin-fg)]/60 hover:text-[var(--admin-fg)]"
                >
                  Clear
                </button>
              )
            }
          >
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories…"
              className="mb-3 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--admin-accent)]"
            />
            {treeCategories.length === 0 ? (
              <p className="text-sm text-[var(--admin-fg)]/50">
                No categories match.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-md border border-[var(--admin-border)]">
                <ul className="divide-y divide-[var(--admin-border)]">
                  {treeCategories.map(({ category: c, depth }) => {
                    const checked = selectedCategoryIds.includes(c.id);
                    return (
                      <li key={c.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-2 py-2 pr-3 text-sm hover:bg-[var(--admin-muted)] ${
                            checked ? "bg-[var(--admin-accent)]/5" : ""
                          }`}
                          style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(c.id)}
                            className="h-4 w-4 rounded border-[var(--admin-border)]"
                          />
                          {depth > 0 && (
                            <span className="text-[var(--admin-fg)]/30">↳</span>
                          )}
                          <span className="flex-1 truncate">{c.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Section>
        </aside>
      </form>

      <MediaPicker
        open={pickerOpen !== null}
        onClose={() => setPickerOpen(null)}
        onSelect={handleMediaSelect}
        multiple={pickerOpen === "gallery"}
      />

      <ProductPicker
        open={relatedPickerOpen}
        onClose={() => setRelatedPickerOpen(false)}
        excludeIds={[
          ...(product ? [product.id] : []),
          ...related.map((r) => r.id),
        ]}
        onSelect={(picks) => {
          setRelated((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            for (const p of picks) {
              if (!map.has(p.id)) {
                map.set(p.id, {
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  sku: p.sku,
                  basePrice: p.basePrice,
                  sellingPrice: p.sellingPrice,
                  images: p.images,
                  active: p.active,
                });
              }
            }
            return Array.from(map.values());
          });
        }}
      />
    </>
  );
}

function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
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
      className={`w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm text-[var(--admin-fg)] outline-none focus:border-[var(--admin-accent)] ${props.className ?? ""}`}
    />
  );
}

ProductForm.displayName = "ProductForm";
