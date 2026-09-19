import { el } from './xml';

/** The product fields the Google Merchant feed needs. */
export interface FeedSource {
  sku: string;
  name: string;
  slug: string;
  active: boolean;
  sellingPrice: string | number;
  basePrice: string | number;
  shortDescription: string;
  description: string;
  images: string[] | null;
  /** Primary category path, root first. */
  categoryPath: string[];
}

export interface FeedContext {
  siteUrl: string;
  brand: string;
  currency: string;
}

/** Google's limits for the text attributes we send. */
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const ADDITIONAL_IMAGES_MAX = 10;

export interface FeedItem {
  /** Why the product is left out of the feed; empty = included. */
  excluded: string[];
  /** Attribute → value, in feed order (for the admin preview). */
  fields: [string, string][];
  /** The `<item>` element exactly as written to the feed ('' when excluded). */
  xml: string;
}

/** Strip tags and collapse whitespace — Merchant Center wants plain text. */
function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.8 ? cut.slice(0, space) : cut}…`;
}

/** Absolute https URL for a stored image or path. */
export function absoluteUrl(siteUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url.replace(/^http:\/\//i, 'https://');
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** The storefront card price: selling price, or base price when unset. */
export function feedPrice(p: Pick<FeedSource, 'sellingPrice' | 'basePrice'>): number {
  const selling = Number(p.sellingPrice);
  return selling > 0 ? selling : Number(p.basePrice);
}

/**
 * Build one feed entry, or explain why the product can't be listed. Used by
 * both the generator and the admin's SKU preview, so the two always agree.
 */
export function buildFeedItem(p: FeedSource, ctx: FeedContext): FeedItem {
  const price = feedPrice(p);
  const images = (p.images ?? []).filter(Boolean);

  const excluded: string[] = [];
  if (!p.active) excluded.push('Inactive');
  if (!(price > 0)) excluded.push('No price ($0)');
  if (images.length === 0) excluded.push('No image');

  const title = clip(plain(p.name), TITLE_MAX);
  const description = clip(
    plain(p.description) || plain(p.shortDescription) || title,
    DESCRIPTION_MAX,
  );

  const fields: [string, string][] = [
    ['g:id', p.sku],
    ['title', title],
    ['description', description],
    ['link', `${ctx.siteUrl}/${p.slug}`],
    ['g:image_link', images[0] ? absoluteUrl(ctx.siteUrl, images[0]) : ''],
    ...images
      .slice(1, 1 + ADDITIONAL_IMAGES_MAX)
      .map((u): [string, string] => ['g:additional_image_link', absoluteUrl(ctx.siteUrl, u)]),
    ['g:availability', 'in_stock'],
    ['g:condition', 'new'],
    ['g:price', `${price.toFixed(2)} ${ctx.currency}`],
    ['g:brand', ctx.brand],
    // Custom-branded promotional goods carry no GTIN/MPN.
    ['g:identifier_exists', 'no'],
    ['g:product_type', p.categoryPath.join(' > ')],
    // Top-level category, handy for splitting Shopping campaigns.
    ['g:custom_label_0', p.categoryPath[0] ?? ''],
  ];

  const xml =
    excluded.length > 0
      ? ''
      : `<item>${fields.map(([k, v]) => el(k, v)).join('')}</item>\n`;

  return { excluded, fields: fields.filter(([, v]) => v !== ''), xml };
}
