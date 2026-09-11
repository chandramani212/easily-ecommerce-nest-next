"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../../lib/client-api";
import { SeoFields, type SeoValue } from "../../../../components/seo-fields";
import { ImageField } from "../../../../components/image-field";
import {
  EditorSection,
  ListEditor,
  SaveBar,
  TextArea,
  TextInput,
} from "../page-editor-kit";
import type { AboutContent, Page } from "../../../../lib/types";

const EMPTY: AboutContent = {
  hero: { title: "", highlight: "", intro: "", image: "", imageAlt: "" },
  why: { heading: "", body: "", callout: "" },
  range: { heading: "", intro: "", items: [], outro: "" },
  details: { heading: "", intro: "", occasions: [], body: "" },
  quotes: { heading: "", intro: "", options: [], outro: "" },
  cta: { heading: "", body: "", buttonLabel: "", buttonHref: "" },
  contact: {
    company: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    closing: "",
  },
};

/** Fill any section missing from older stored content so every field binds. */
function withDefaults(content: Partial<AboutContent> | undefined): AboutContent {
  const c = content ?? {};
  return {
    hero: { ...EMPTY.hero, ...c.hero },
    why: { ...EMPTY.why, ...c.why },
    range: { ...EMPTY.range, ...c.range },
    details: { ...EMPTY.details, ...c.details },
    quotes: { ...EMPTY.quotes, ...c.quotes },
    cta: { ...EMPTY.cta, ...c.cta },
    contact: { ...EMPTY.contact, ...c.contact },
  };
}

const PARAGRAPH_HINT = "Separate paragraphs with a blank line.";

function Hint({ children }: { children: string }) {
  return <p className="text-xs text-[var(--admin-fg)]/50">{children}</p>;
}

export function AboutEditor({ page }: { page: Page<AboutContent> }) {
  const router = useRouter();
  const [c, setC] = useState<AboutContent>(() => withDefaults(page.content));
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

  /** Patch one section of the content. */
  const patch = <K extends keyof AboutContent>(
    k: K,
    p: Partial<AboutContent[K]>,
  ) => setC((prev) => ({ ...prev, [k]: { ...prev[k], ...p } }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await clientApi(`/pages/about`, {
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
              onChange={(v) => patch("hero", { title: v })}
            />
            <TextInput
              label="Highlighted heading"
              value={c.hero.highlight}
              onChange={(v) => patch("hero", { highlight: v })}
            />
          </div>
          <TextArea
            label="Intro"
            rows={6}
            value={c.hero.intro}
            onChange={(v) => patch("hero", { intro: v })}
          />
          <Hint>{PARAGRAPH_HINT}</Hint>
          <ImageField
            label="Image (shown beside the heading)"
            value={c.hero.image}
            onChange={(v) => patch("hero", { image: v })}
            hint="Landscape works best (3:2). Leave empty to show the text full width."
          />
          <TextInput
            label="Image alt text"
            value={c.hero.imageAlt}
            onChange={(v) => patch("hero", { imageAlt: v })}
          />
        </div>
      </EditorSection>

      <EditorSection title="Why us">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={c.why.heading}
            onChange={(v) => patch("why", { heading: v })}
          />
          <TextArea
            label="Body"
            rows={10}
            value={c.why.body}
            onChange={(v) => patch("why", { body: v })}
          />
          <Hint>{PARAGRAPH_HINT}</Hint>
          <TextArea
            label="Pull quote (shown large beside the body)"
            rows={2}
            value={c.why.callout}
            onChange={(v) => patch("why", { callout: v })}
          />
        </div>
      </EditorSection>

      <EditorSection title="Product range">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={c.range.heading}
            onChange={(v) => patch("range", { heading: v })}
          />
          <TextInput
            label="Intro"
            value={c.range.intro}
            onChange={(v) => patch("range", { intro: v })}
          />
          <ListEditor
            title="Products"
            items={c.range.items}
            onChange={(v) => patch("range", { items: v })}
            empty={{ label: "" }}
            addLabel="+ Add product type"
            renderRow={(item, p) => (
              <TextInput
                label="Label"
                value={item.label}
                onChange={(v) => p({ label: v })}
              />
            )}
          />
          <TextArea
            label="Notes under the list"
            rows={4}
            value={c.range.outro}
            onChange={(v) => patch("range", { outro: v })}
          />
          <Hint>
            Each paragraph is shown as its own column. Separate them with a
            blank line.
          </Hint>
        </div>
      </EditorSection>

      <EditorSection title="Details">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={c.details.heading}
            onChange={(v) => patch("details", { heading: v })}
          />
          <TextInput
            label="Intro"
            value={c.details.intro}
            onChange={(v) => patch("details", { intro: v })}
          />
          <ListEditor
            title="Occasions"
            items={c.details.occasions}
            onChange={(v) => patch("details", { occasions: v })}
            empty={{ label: "" }}
            addLabel="+ Add occasion"
            renderRow={(item, p) => (
              <TextInput
                label="Label"
                value={item.label}
                onChange={(v) => p({ label: v })}
              />
            )}
          />
          <TextArea
            label="Body"
            rows={6}
            value={c.details.body}
            onChange={(v) => patch("details", { body: v })}
          />
          <Hint>{PARAGRAPH_HINT}</Hint>
        </div>
      </EditorSection>

      <EditorSection title="Better quotes">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={c.quotes.heading}
            onChange={(v) => patch("quotes", { heading: v })}
          />
          <TextArea
            label="Intro"
            rows={4}
            value={c.quotes.intro}
            onChange={(v) => patch("quotes", { intro: v })}
          />
          <Hint>{PARAGRAPH_HINT}</Hint>
          <ListEditor
            title="Options"
            items={c.quotes.options}
            onChange={(v) => patch("quotes", { options: v })}
            empty={{ text: "" }}
            addLabel="+ Add option"
            renderRow={(item, p) => (
              <TextInput
                label="Text"
                value={item.text}
                onChange={(v) => p({ text: v })}
              />
            )}
          />
          <TextInput
            label="Closing line"
            value={c.quotes.outro}
            onChange={(v) => patch("quotes", { outro: v })}
          />
        </div>
      </EditorSection>

      <EditorSection title="Call to action">
        <div className="space-y-3">
          <TextInput
            label="Heading"
            value={c.cta.heading}
            onChange={(v) => patch("cta", { heading: v })}
          />
          <TextArea
            label="Body"
            rows={4}
            value={c.cta.body}
            onChange={(v) => patch("cta", { body: v })}
          />
          <Hint>{PARAGRAPH_HINT}</Hint>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Button label"
              value={c.cta.buttonLabel}
              onChange={(v) => patch("cta", { buttonLabel: v })}
            />
            <TextInput
              label="Button link"
              value={c.cta.buttonHref}
              onChange={(v) => patch("cta", { buttonHref: v })}
              placeholder="/contact"
            />
          </div>
          <Hint>Leave the button label empty to hide the button.</Hint>
        </div>
      </EditorSection>

      <EditorSection title="Contact details">
        <div className="space-y-3">
          <TextInput
            label="Company name"
            value={c.contact.company}
            onChange={(v) => patch("contact", { company: v })}
          />
          <TextArea
            label="Address (one line per row)"
            rows={4}
            value={c.contact.address}
            onChange={(v) => patch("contact", { address: v })}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput
              label="Phone"
              value={c.contact.phone}
              onChange={(v) => patch("contact", { phone: v })}
            />
            <TextInput
              label="Email"
              value={c.contact.email}
              onChange={(v) => patch("contact", { email: v })}
            />
            <TextInput
              label="Website"
              value={c.contact.website}
              onChange={(v) => patch("contact", { website: v })}
            />
          </div>
          <TextInput
            label="Closing line"
            value={c.contact.closing}
            onChange={(v) => patch("contact", { closing: v })}
          />
        </div>
      </EditorSection>

      <EditorSection title="SEO">
        <SeoFields value={seo} onChange={setSeo} showCanonical />
      </EditorSection>

      <SaveBar saving={saving} saved={saved} onSave={save} />
    </div>
  );
}
