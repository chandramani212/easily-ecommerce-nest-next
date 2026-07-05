"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../../lib/client-api";
import { ImageField } from "../../../../components/image-field";
import { RichTextEditor } from "../../../../components/rich-text-editor";
import { SeoFields, type SeoValue } from "../../../../components/seo-fields";
import {
  EditorSection,
  SaveBar,
  TextArea,
  TextInput,
  moveItem,
} from "../page-editor-kit";
import type { HeroSlide, HomeContent, Page } from "../../../../lib/types";

const EMPTY_SLIDE: HeroSlide = {
  tag: "",
  heading: "",
  highlight: "",
  description: "",
  ctaLabel: "",
  ctaHref: "/#shop",
  ctaSecondaryLabel: "",
  ctaSecondaryHref: "",
  gradient: "from-teal-700 via-emerald-700 to-green-800",
  image: "",
};

export function HomeEditor({ page }: { page: Page<HomeContent> }) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>(
    page.content?.hero?.slides ?? [],
  );
  const [autoPlayMs, setAutoPlayMs] = useState(
    page.content?.hero?.autoPlayMs ?? 5000,
  );
  const [contentHeading, setContentHeading] = useState(
    page.content?.content?.heading ?? "",
  );
  const [contentBody, setContentBody] = useState(
    page.content?.content?.body ?? "",
  );
  const [seo, setSeo] = useState<SeoValue>({
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogImage: page.ogImage ?? "",
    keywords: page.keywords,
    canonicalUrl: page.canonicalUrl,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const patchSlide = (i: number, patch: Partial<HeroSlide>) =>
    setSlides((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await clientApi(`/pages/home`, {
        method: "PUT",
        body: JSON.stringify({
          content: {
            hero: { autoPlayMs: Number(autoPlayMs) || 5000, slides },
            content: { heading: contentHeading, body: contentBody },
          },
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          ogImage: seo.ogImage || undefined,
          keywords: seo.keywords,
          canonicalUrl: seo.canonicalUrl,
        }),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof DemoReadOnlyError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Save failed",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <EditorSection
        title="Hero slider"
        right={
          <label className="flex items-center gap-2 text-xs text-[var(--admin-fg)]/70">
            Autoplay (ms)
            <input
              type="number"
              min={1000}
              step={500}
              value={autoPlayMs}
              onChange={(e) => setAutoPlayMs(Number(e.target.value))}
              className="w-24 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 py-1 text-xs"
            />
          </label>
        }
      >
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--admin-border)] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--admin-fg)]/60">
                  Slide {i + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSlides((p) => moveItem(p, i, -1))}
                    disabled={i === 0}
                    className="rounded border border-[var(--admin-border)] px-2 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlides((p) => moveItem(p, i, 1))}
                    disabled={i === slides.length - 1}
                    className="rounded border border-[var(--admin-border)] px-2 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSlides((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="rounded border border-[var(--admin-border)] px-2 text-xs text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <ImageField
                label="Slide image"
                value={slide.image}
                onChange={(url) => patchSlide(i, { image: url })}
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Tag / badge"
                  value={slide.tag}
                  onChange={(v) => patchSlide(i, { tag: v })}
                />
                <TextInput
                  label="Gradient (Tailwind classes)"
                  value={slide.gradient}
                  onChange={(v) => patchSlide(i, { gradient: v })}
                />
                <TextInput
                  label="Heading"
                  value={slide.heading}
                  onChange={(v) => patchSlide(i, { heading: v })}
                />
                <TextInput
                  label="Highlighted heading"
                  value={slide.highlight}
                  onChange={(v) => patchSlide(i, { highlight: v })}
                />
              </div>
              <div className="mt-3">
                <TextArea
                  label="Description"
                  value={slide.description}
                  onChange={(v) => patchSlide(i, { description: v })}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Primary button label"
                  value={slide.ctaLabel}
                  onChange={(v) => patchSlide(i, { ctaLabel: v })}
                />
                <TextInput
                  label="Primary button link"
                  value={slide.ctaHref}
                  onChange={(v) => patchSlide(i, { ctaHref: v })}
                />
                <TextInput
                  label="Secondary button label"
                  value={slide.ctaSecondaryLabel}
                  onChange={(v) => patchSlide(i, { ctaSecondaryLabel: v })}
                />
                <TextInput
                  label="Secondary button link"
                  value={slide.ctaSecondaryHref}
                  onChange={(v) => patchSlide(i, { ctaSecondaryHref: v })}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setSlides((p) => [...p, { ...EMPTY_SLIDE }])}
            className="text-sm font-medium text-[var(--admin-accent)]"
          >
            + Add slide
          </button>
        </div>
      </EditorSection>

      <EditorSection title="Content block (bottom of page)">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={contentHeading}
            onChange={setContentHeading}
          />
          <RichTextEditor
            label="Body"
            value={contentBody}
            onChange={setContentBody}
          />
          <p className="text-xs text-[var(--admin-fg)]/50">
            Shown as the last section on the home page. Leave both fields empty
            to hide it.
          </p>
        </div>
      </EditorSection>

      <EditorSection title="SEO">
        <SeoFields value={seo} onChange={setSeo} showCanonical />
      </EditorSection>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
