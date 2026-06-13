"use client";

import { ImageField } from "./image-field";

export interface SeoValue {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  keywords: string;
  canonicalUrl?: string;
}

const inputCls =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

/**
 * SEO editor block shared by the page editors and the product form. Pass
 * `showCanonical` for pages (products don't expose a canonical override).
 */
export function SeoFields({
  value,
  onChange,
  showCanonical = false,
}: {
  value: SeoValue;
  onChange: (next: SeoValue) => void;
  showCanonical?: boolean;
}) {
  const set = <K extends keyof SeoValue>(key: K, v: SeoValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--admin-fg)]/70">
            Meta title
          </span>
          <input
            value={value.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)}
            className={inputCls}
            maxLength={200}
            placeholder="Title shown in search results & browser tab"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--admin-fg)]/70">
            Keywords
          </span>
          <input
            value={value.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            className={inputCls}
            placeholder="comma, separated, keywords"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-[var(--admin-fg)]/70">
          Meta description
        </span>
        <textarea
          value={value.metaDescription}
          onChange={(e) => set("metaDescription", e.target.value)}
          rows={3}
          maxLength={400}
          className={inputCls}
          placeholder="~150-160 characters summarizing the page"
        />
        <span className="text-[11px] text-[var(--admin-fg)]/40">
          {value.metaDescription.length}/400
        </span>
      </label>

      {showCanonical && (
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--admin-fg)]/70">
            Canonical URL (optional)
          </span>
          <input
            value={value.canonicalUrl ?? ""}
            onChange={(e) => set("canonicalUrl", e.target.value)}
            className={inputCls}
            placeholder="https://example.com/page"
          />
        </label>
      )}

      <ImageField
        label="Social share image (Open Graph)"
        value={value.ogImage}
        onChange={(url) => set("ogImage", url)}
        hint="Shown when the page is shared on social media (recommended 1200×630)."
      />
    </div>
  );
}
