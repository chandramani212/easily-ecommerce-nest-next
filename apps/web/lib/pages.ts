import type { Metadata } from "next";

import { apiFetchSafe, API_URL } from "./api";

export interface PageDoc<C = Record<string, unknown>> {
  slug: string;
  title: string;
  content: C;
  metaTitle: string;
  metaDescription: string;
  ogImage?: string | null;
  keywords: string;
  canonicalUrl: string;
}

export interface HeroSlide {
  tag: string;
  heading: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  gradient: string;
  image: string;
  /** Full-image slider only. */
  imageMobile?: string;
  href?: string;
  alt?: string;
}

export interface HomeContent {
  /** `variant`: "split" = text + side image (default), "full" = full-width
   * banner image that links somewhere. */
  hero: { autoPlayMs: number; variant?: "split" | "full"; slides: HeroSlide[] };
  /** Optional free-form content block rendered at the bottom of the home page. */
  content?: { heading: string; body: string };
  /** Admin-curated products for the "Most Popular" tab (by slug, in order).
   * When empty/unset, the home page falls back to the newest active products. */
  popularProducts?: { slug: string }[];
}

/** About page. Multi-paragraph text fields separate paragraphs with a blank
 * line; `contact.address` puts one line per row. Any section may be absent
 * (older content), in which case it is not rendered. */
export interface AboutContent {
  hero: {
    title: string;
    highlight: string;
    intro: string;
    image?: string;
    imageAlt?: string;
  };
  why?: { heading: string; body: string; callout: string };
  range?: {
    heading: string;
    intro: string;
    items: { label: string }[];
    outro: string;
  };
  details?: {
    heading: string;
    intro: string;
    occasions: { label: string }[];
    body: string;
  };
  quotes?: {
    heading: string;
    intro: string;
    options: { text: string }[];
    outro: string;
  };
  cta?: { heading: string; body: string; buttonLabel: string; buttonHref: string };
  contact?: {
    company: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    closing: string;
  };
}

export interface ContactContent {
  hero: { title: string; highlight: string; intro: string };
  info: { title: string; description: string; detail: string; icon?: string }[];
  formHeading: string;
  formSubheading: string;
  faqHeading: string;
  faqSubheading: string;
  faq: { question: string; answer: string }[];
}

/** Privacy Policy / Terms & Conditions — a single rich-text body. */
export interface LegalContent {
  body: string;
}

/** Fetch an editable page from the API (public endpoint). Null on failure. */
export function getPage<C>(slug: string): Promise<PageDoc<C> | null> {
  return apiFetchSafe<PageDoc<C>>(`/pages/${slug}`);
}

/** Resolve a possibly-relative media URL to an absolute one for social cards. */
function absoluteImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API_URL}${url}`;
  return url;
}

/**
 * Build Next.js <head> metadata from a page's SEO fields, falling back to the
 * static defaults already declared on each page when the API is unavailable.
 */
export function pageMetadata(
  page: PageDoc<unknown> | null,
  fallback: Metadata,
): Metadata {
  if (!page) return fallback;
  const img = absoluteImage(page.ogImage);
  return {
    title: page.metaTitle || fallback.title,
    description: page.metaDescription || fallback.description,
    keywords: page.keywords || undefined,
    alternates: page.canonicalUrl
      ? { canonical: page.canonicalUrl }
      : undefined,
    openGraph: {
      title: page.metaTitle || undefined,
      description: page.metaDescription || undefined,
      images: img ? [img] : undefined,
    },
  };
}
