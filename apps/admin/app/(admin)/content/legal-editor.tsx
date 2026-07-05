"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import { RichTextEditor } from "../../../components/rich-text-editor";
import { SeoFields, type SeoValue } from "../../../components/seo-fields";
import { EditorSection, SaveBar } from "./page-editor-kit";
import type { LegalContent, Page } from "../../../lib/types";

/**
 * Shared editor for simple rich-text legal pages (Privacy Policy, Terms &
 * Conditions). Persists to `/pages/<slug>`.
 */
export function LegalEditor({
  slug,
  page,
}: {
  slug: string;
  page: Page<LegalContent>;
}) {
  const router = useRouter();
  const [body, setBody] = useState(page.content?.body ?? "");
  const [seo, setSeo] = useState<SeoValue>({
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogImage: page.ogImage ?? "",
    keywords: page.keywords,
    canonicalUrl: page.canonicalUrl,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await clientApi(`/pages/${slug}`, {
        method: "PUT",
        body: JSON.stringify({
          content: { body },
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

      <EditorSection title="Content">
        <RichTextEditor label="Body" value={body} onChange={setBody} />
      </EditorSection>

      <EditorSection title="SEO">
        <SeoFields value={seo} onChange={setSeo} showCanonical />
      </EditorSection>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
