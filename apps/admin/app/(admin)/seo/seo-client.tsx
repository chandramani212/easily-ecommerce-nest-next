"use client";

import { useCallback, useEffect, useState } from "react";

import { clientApi } from "../../../lib/client-api";
import type {
  FeedPreview,
  SeoFile,
  SeoStatus,
  SeoTarget,
  SeoTargetName,
  Settings,
} from "../../../lib/types";

const CARD =
  "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5";
const BTN =
  "rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50";
const BTN_PRIMARY =
  "rounded-lg bg-[var(--admin-fg)] px-4 py-2 text-sm font-semibold text-[var(--admin-bg)] transition-opacity hover:opacity-90 disabled:opacity-40";
const INPUT =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

/** Files are served publicly by the API; view them through the admin proxy. */
const viewHref = (path: string) => `/api/proxy/seo${path}`;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ago(iso: string | null) {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

const when = (iso: string | null) =>
  iso ? `${new Date(iso).toLocaleString()} (${ago(iso)})` : "Never generated";

export function SeoClient({
  initial,
  settings,
}: {
  initial: SeoStatus;
  settings: Settings;
}) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await clientApi<SeoStatus>("/seo/status"));
    } catch {
      /* keep the last good status */
    }
  }, []);

  const running = status.targets.some((t) => t.status === "running");
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void refresh(), 1500);
    return () => clearInterval(timer);
  }, [running, refresh]);

  async function regenerate(target: SeoTargetName | "all") {
    setError(null);
    try {
      await clientApi("/seo/generate", {
        method: "POST",
        body: JSON.stringify({ target }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start regeneration");
    }
  }

  const target = (t: SeoTargetName) =>
    status.targets.find((x) => x.target === t)!;
  const files = (t: SeoTargetName) => status.files.filter((f) => f.target === t);
  const feedFile = files("feed")[0];
  const sitemapFiles = files("sitemaps");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={() => regenerate("all")} disabled={running} className={BTN_PRIMARY}>
          {running ? "Regenerating…" : "Regenerate all"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <SiteSettings settings={settings} onSaved={refresh} />

      {/* ---- Google Merchant Center feed ------------------------------ */}
      <section className={CARD}>
        <CardHead
          title="Google Merchant Center feed"
          target={target("feed")}
          onRegenerate={() => regenerate("feed")}
        />
        <PublicUrl url={`${status.siteUrl}/feeds/google-merchant.xml`} />
        <p className="mt-2 text-xs text-[var(--admin-fg)]/60">
          In Merchant Center: Products → Data sources → Add product source →
          &ldquo;Add products from a file&rdquo; → enter this link and set a
          daily fetch. The file is rebuilt every night at 02:30 (server time).
        </p>

        {feedFile ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Products in feed" value={feedFile.items.toLocaleString()} />
            <Stat
              label="Left out"
              value={Object.values(target("feed").stats.excluded ?? {})
                .reduce((a, b) => a + b, 0)
                .toLocaleString()}
            />
            <Stat label="File size" value={formatBytes(feedFile.bytes)} />
            <Stat label="Last generated" value={ago(feedFile.generatedAt)} title={when(feedFile.generatedAt)} />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-[var(--admin-fg)]/60">Not generated yet.</p>
        )}

        {Object.keys(target("feed").stats.excluded ?? {}).length > 0 && (
          <p className="mt-3 text-xs text-[var(--admin-fg)]/60">
            Left out:{" "}
            {Object.entries(target("feed").stats.excluded!)
              .map(([reason, n]) => `${reason} — ${n.toLocaleString()}`)
              .join(" · ")}
          </p>
        )}
        {feedFile && (
          <a href={viewHref(feedFile.path)} className={`${BTN} mt-4 inline-block`} download>
            Download feed
          </a>
        )}
      </section>

      {/* ---- Sitemaps ------------------------------------------------- */}
      <section className={CARD}>
        <CardHead
          title="Sitemaps"
          target={target("sitemaps")}
          onRegenerate={() => regenerate("sitemaps")}
        />
        <PublicUrl url={`${status.siteUrl}/sitemap.xml`} />
        <p className="mt-2 text-xs text-[var(--admin-fg)]/60">
          Submit this index in Google Search Console → Sitemaps. It links to the
          files below and is also listed in{" "}
          <a href={viewHref("/robots.txt")} target="_blank" rel="noreferrer" className="underline">
            robots.txt
          </a>
          . Only active products with a price and active categories with products
          are included. Rebuilt every night at 02:30.
        </p>

        {sitemapFiles.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--admin-fg)]/60">Not generated yet.</p>
        ) : (
          <FileTable files={sitemapFiles} siteUrl={status.siteUrl} />
        )}
      </section>

      <FeedPreviewCard />
    </div>
  );
}

function CardHead({
  title,
  target,
  onRegenerate,
}: {
  title: string;
  target: SeoTarget;
  onRegenerate: () => void;
}) {
  const running = target.status === "running";
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--admin-fg)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-fg)]/60">
            {running
              ? "Regenerating now…"
              : target.finishedAt
                ? `Last run ${when(target.finishedAt)} · ${target.trigger === "schedule" ? "nightly schedule" : "manual"}${target.durationMs != null ? ` · took ${(target.durationMs / 1000).toFixed(1)}s` : ""}`
                : "Never generated"}
          </p>
        </div>
        <button onClick={onRegenerate} disabled={running} className={BTN}>
          {running ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      {target.status === "failed" && target.error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          Last run failed: {target.error}
        </p>
      )}
    </div>
  );
}

function PublicUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--admin-muted)] px-3 py-2">
      <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 text-xs font-medium text-[var(--admin-accent)] hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function FileTable({ files, siteUrl }: { files: SeoFile[]; siteUrl: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-[var(--admin-fg)]/50">
          <tr>
            <th className="pb-2 pr-4 font-medium">File</th>
            <th className="pb-2 pr-4 text-right font-medium">URLs</th>
            <th className="pb-2 pr-4 text-right font-medium">Size</th>
            <th className="pb-2 pr-4 font-medium">Generated</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">
          {files.map((f) => (
            <tr key={f.key}>
              <td className="py-2 pr-4">
                <span className="font-mono text-xs" title={siteUrl + f.path}>
                  {f.path}
                </span>
                {f.key === "sitemap-index" && (
                  <span className="ml-2 rounded bg-[var(--admin-muted)] px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    index
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {f.key === "sitemap-index" ? `${f.items} files` : f.items.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatBytes(f.bytes)}</td>
              <td className="py-2 pr-4 text-xs text-[var(--admin-fg)]/60" title={when(f.generatedAt)}>
                {ago(f.generatedAt)}
              </td>
              <td className="py-2 text-right">
                <a
                  href={viewHref(f.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SiteSettings({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => Promise<void>;
}) {
  const [siteUrl, setSiteUrl] = useState(settings.siteUrl);
  const [feedBrand, setFeedBrand] = useState(settings.feedBrand);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await clientApi("/settings", {
        method: "PUT",
        body: JSON.stringify({ siteUrl, feedBrand }),
      });
      await onSaved();
      setMessage("Saved — regenerate the files to apply it.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className={CARD}>
      <h2 className="text-sm font-semibold text-[var(--admin-fg)]">Site details</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--admin-fg)]/60">
            Website URL (used in every sitemap and feed link)
          </span>
          <input
            className={INPUT}
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://easilybranded.com"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--admin-fg)]/60">
            Brand name in the Google feed
          </span>
          <input
            className={INPUT}
            value={feedBrand}
            onChange={(e) => setFeedBrand(e.target.value)}
            maxLength={70}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={saving} className={BTN}>
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-xs text-[var(--admin-fg)]/60">{message}</span>}
      </div>
    </form>
  );
}

function FeedPreviewCard() {
  const [sku, setSku] = useState("");
  const [result, setResult] = useState<FeedPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!sku.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(
        await clientApi<FeedPreview>(`/seo/feed-preview?sku=${encodeURIComponent(sku.trim())}`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={CARD}>
      <h2 className="text-sm font-semibold text-[var(--admin-fg)]">
        Check a product in the feed
      </h2>
      <p className="mt-0.5 text-xs text-[var(--admin-fg)]/60">
        Enter a SKU to see exactly what Google receives for it — or why it is
        left out. Reflects the product as it is now, even before the next
        regeneration.
      </p>
      <form onSubmit={search} className="mt-3 flex gap-2">
        <input
          className={`${INPUT} max-w-xs font-mono`}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="EB-000123"
        />
        <button type="submit" disabled={loading || !sku.trim()} className={BTN}>
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                result.included
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600"
              }`}
            >
              {result.included ? "In the feed" : "Left out of the feed"}
            </span>
            <span className="text-sm font-medium">{result.name}</span>
            <a
              href={result.productUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--admin-accent)] hover:underline"
            >
              {result.productUrl}
            </a>
          </div>
          {!result.included && (
            <p className="mt-2 text-sm text-amber-600">
              Reason: {result.excluded.join(", ")}
            </p>
          )}
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-[var(--admin-border)]">
              {result.fields.map(([k, v], i) => (
                <tr key={i} className="align-top">
                  <td className="w-48 py-1.5 pr-4 font-mono text-xs text-[var(--admin-fg)]/60">
                    {k}
                  </td>
                  <td className="break-all py-1.5 text-xs">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div title={title}>
      <dt className="text-xs text-[var(--admin-fg)]/50">{label}</dt>
      <dd className="text-lg font-semibold text-[var(--admin-fg)]">{value}</dd>
    </div>
  );
}
