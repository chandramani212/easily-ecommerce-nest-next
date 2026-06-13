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
import type { AboutContent, Page } from "../../../../lib/types";

export function AboutEditor({ page }: { page: Page<AboutContent> }) {
  const router = useRouter();
  const [c, setC] = useState<AboutContent>(page.content);
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

  const set = <K extends keyof AboutContent>(k: K, v: AboutContent[K]) =>
    setC((prev) => ({ ...prev, [k]: v }));
  const setHero = (p: Partial<AboutContent["hero"]>) =>
    setC((prev) => ({ ...prev, hero: { ...prev.hero, ...p } }));

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

      <EditorSection title="Stats bar">
        <ListEditor
          title="Stats"
          items={c.stats}
          onChange={(v) => set("stats", v)}
          empty={{ value: "", label: "" }}
          addLabel="+ Add stat"
          renderRow={(item, patch) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Value"
                value={item.value}
                onChange={(v) => patch({ value: v })}
              />
              <TextInput
                label="Label"
                value={item.label}
                onChange={(v) => patch({ label: v })}
              />
            </div>
          )}
        />
      </EditorSection>

      <EditorSection title="Core values">
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Section heading"
            value={c.valuesHeading}
            onChange={(v) => set("valuesHeading", v)}
          />
          <TextInput
            label="Section subtitle"
            value={c.valuesSubtitle}
            onChange={(v) => set("valuesSubtitle", v)}
          />
        </div>
        <ListEditor
          title="Values"
          items={c.values}
          onChange={(v) => set("values", v)}
          empty={{ title: "", description: "" }}
          addLabel="+ Add value"
          renderRow={(item, patch) => (
            <div className="space-y-3">
              <TextInput
                label="Title"
                value={item.title}
                onChange={(v) => patch({ title: v })}
              />
              <TextArea
                label="Description"
                value={item.description}
                onChange={(v) => patch({ description: v })}
              />
            </div>
          )}
        />
      </EditorSection>

      <EditorSection title="Timeline">
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Section heading"
            value={c.timelineHeading}
            onChange={(v) => set("timelineHeading", v)}
          />
          <TextInput
            label="Section subtitle"
            value={c.timelineSubtitle}
            onChange={(v) => set("timelineSubtitle", v)}
          />
        </div>
        <ListEditor
          title="Milestones"
          items={c.milestones}
          onChange={(v) => set("milestones", v)}
          empty={{ year: "", title: "", description: "" }}
          addLabel="+ Add milestone"
          renderRow={(item, patch) => (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Year"
                  value={item.year}
                  onChange={(v) => patch({ year: v })}
                />
                <TextInput
                  label="Title"
                  value={item.title}
                  onChange={(v) => patch({ title: v })}
                />
              </div>
              <TextArea
                label="Description"
                value={item.description}
                onChange={(v) => patch({ description: v })}
              />
            </div>
          )}
        />
      </EditorSection>

      <EditorSection title="Team">
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Section heading"
            value={c.teamHeading}
            onChange={(v) => set("teamHeading", v)}
          />
          <TextInput
            label="Section subtitle"
            value={c.teamSubtitle}
            onChange={(v) => set("teamSubtitle", v)}
          />
        </div>
        <ListEditor
          title="Members"
          items={c.team}
          onChange={(v) => set("team", v)}
          empty={{ name: "", role: "", initials: "", color: "#1a9e7a" }}
          addLabel="+ Add member"
          renderRow={(item, patch) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Name"
                value={item.name}
                onChange={(v) => patch({ name: v })}
              />
              <TextInput
                label="Role"
                value={item.role}
                onChange={(v) => patch({ role: v })}
              />
              <TextInput
                label="Initials"
                value={item.initials}
                onChange={(v) => patch({ initials: v })}
              />
              <TextInput
                label="Avatar color (hex)"
                value={item.color}
                onChange={(v) => patch({ color: v })}
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
