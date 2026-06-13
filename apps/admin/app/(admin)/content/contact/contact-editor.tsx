"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../../lib/client-api";
import { SeoFields, type SeoValue } from "../../../../components/seo-fields";
import {
  EditorSection,
  ListEditor,
  SaveBar,
  TextArea,
  TextInput,
} from "../page-editor-kit";
import type { ContactContent, Page } from "../../../../lib/types";

export function ContactEditor({ page }: { page: Page<ContactContent> }) {
  const router = useRouter();
  const [c, setC] = useState<ContactContent>(page.content);
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

  const set = <K extends keyof ContactContent>(k: K, v: ContactContent[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));
  const setHero = (p: Partial<ContactContent["hero"]>) =>
    setC((prev) => ({ ...prev, hero: { ...prev.hero, ...p } }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await clientApi(`/pages/contact`, {
        method: "PUT",
        body: JSON.stringify({
          content: c,
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

      <EditorSection title="Hero">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Heading"
              value={c.hero.title}
              onChange={(v) => setHero({ title: v })}
            />
            <TextInput
              label="Highlighted heading"
              value={c.hero.highlight}
              onChange={(v) => setHero({ highlight: v })}
            />
          </div>
          <TextArea
            label="Intro paragraph"
            value={c.hero.intro}
            onChange={(v) => setHero({ intro: v })}
          />
        </div>
      </EditorSection>

      <EditorSection title="Contact cards">
        <ListEditor
          title="Contact info"
          items={c.info}
          onChange={(v) => set("info", v)}
          empty={{ title: "", description: "", detail: "" }}
          addLabel="+ Add contact card"
          renderRow={(item, patch) => (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Title"
                  value={item.title}
                  onChange={(v) => patch({ title: v })}
                />
                <TextInput
                  label="Detail (email / phone / address)"
                  value={item.detail}
                  onChange={(v) => patch({ detail: v })}
                />
              </div>
              <TextInput
                label="Description"
                value={item.description}
                onChange={(v) => patch({ description: v })}
              />
            </div>
          )}
        />
      </EditorSection>

      <EditorSection title="Message form text">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Form heading"
            value={c.formHeading}
            onChange={(v) => set("formHeading", v)}
          />
          <TextInput
            label="Form subheading"
            value={c.formSubheading}
            onChange={(v) => set("formSubheading", v)}
          />
        </div>
      </EditorSection>

      <EditorSection title="FAQ">
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Section heading"
            value={c.faqHeading}
            onChange={(v) => set("faqHeading", v)}
          />
          <TextInput
            label="Section subtitle"
            value={c.faqSubheading}
            onChange={(v) => set("faqSubheading", v)}
          />
        </div>
        <ListEditor
          title="Questions"
          items={c.faq}
          onChange={(v) => set("faq", v)}
          empty={{ question: "", answer: "" }}
          addLabel="+ Add question"
          renderRow={(item, patch) => (
            <div className="space-y-3">
              <TextInput
                label="Question"
                value={item.question}
                onChange={(v) => patch({ question: v })}
              />
              <TextArea
                label="Answer"
                value={item.answer}
                onChange={(v) => patch({ answer: v })}
              />
            </div>
          )}
        />
      </EditorSection>

      <EditorSection title="SEO">
        <SeoFields value={seo} onChange={setSeo} showCanonical />
      </EditorSection>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
