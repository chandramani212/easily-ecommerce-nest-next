/**
 * Classify a lead's acquisition source from UTM params + referrer into one of a
 * small set of buckets, plus a headline `organic` flag (organic = NOT acquired
 * through paid/email marketing). Pure + deterministic so it's easy to test.
 */

export type LeadSource =
  | 'organic'
  | 'paid'
  | 'social'
  | 'referral'
  | 'email'
  | 'direct';

export interface AttributionInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
}

export interface ClassifiedSource {
  source: LeadSource;
  organic: boolean;
}

const PAID_MEDIUMS = [
  'cpc',
  'ppc',
  'paid',
  'paidsearch',
  'paid-search',
  'paidsocial',
  'paid-social',
  'display',
  'cpm',
  'banner',
  'retargeting',
];
const EMAIL_MEDIUMS = ['email', 'e-mail', 'newsletter'];
const SOCIAL_MEDIUMS = ['social', 'social-organic', 'sm', 'social-media'];
const EMAIL_SOURCES = ['email', 'newsletter', 'mailchimp', 'klaviyo', 'sendgrid'];
const SOCIAL_HOSTS = [
  'facebook.',
  'instagram.',
  'twitter.',
  'x.com',
  't.co',
  'linkedin.',
  'lnkd.in',
  'youtube.',
  'pinterest.',
  'tiktok.',
  'reddit.',
  'wa.me',
  'whatsapp',
];
const SEARCH_HOSTS = [
  'google.',
  'bing.',
  'yahoo.',
  'duckduckgo.',
  'ecosia.',
  'baidu.',
  'yandex.',
];

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function classifyLeadSource(input: AttributionInput): ClassifiedSource {
  const src = (input.utmSource ?? '').trim().toLowerCase();
  const medium = (input.utmMedium ?? '').trim().toLowerCase();
  const ref = (input.referrer ?? '').trim();
  const refHost = ref ? host(ref) : '';

  // Paid marketing wins — explicit paid medium, or an ad-network gclid-style source.
  if (PAID_MEDIUMS.includes(medium) || src === 'adwords' || src === 'gclid') {
    return { source: 'paid', organic: false };
  }
  // Email campaigns.
  if (EMAIL_MEDIUMS.includes(medium) || EMAIL_SOURCES.includes(src)) {
    return { source: 'email', organic: false };
  }
  // Organic social (paid social already captured above).
  if (
    SOCIAL_MEDIUMS.includes(medium) ||
    SOCIAL_HOSTS.some((h) => src.includes(h) || refHost.includes(h))
  ) {
    return { source: 'social', organic: true };
  }
  // Organic search.
  if (
    medium === 'organic' ||
    SEARCH_HOSTS.some((h) => src.includes(h) || refHost.includes(h))
  ) {
    return { source: 'organic', organic: true };
  }
  // Any other explicit referrer or referral medium → referral.
  if (medium === 'referral' || (refHost && !src)) {
    return { source: 'referral', organic: true };
  }
  // A campaign source with no recognizable medium → treat as referral.
  if (src) {
    return { source: 'referral', organic: true };
  }
  // No signals at all.
  return { source: 'direct', organic: true };
}

export const LEAD_SOURCES: LeadSource[] = [
  'organic',
  'paid',
  'social',
  'referral',
  'email',
  'direct',
];

/** Normalize a utm_source / host fragment to a friendly platform name. */
const PROVIDER_ALIASES: Record<string, string> = {
  google: 'google',
  googleads: 'google',
  'google-ads': 'google',
  adwords: 'google',
  gclid: 'google',
  bing: 'bing',
  'microsoft-ads': 'bing',
  yahoo: 'yahoo',
  duckduckgo: 'duckduckgo',
  ecosia: 'ecosia',
  baidu: 'baidu',
  yandex: 'yandex',
  fb: 'facebook',
  facebook: 'facebook',
  meta: 'facebook',
  ig: 'instagram',
  instagram: 'instagram',
  yt: 'youtube',
  youtube: 'youtube',
  linkedin: 'linkedin',
  lnkd: 'linkedin',
  twitter: 'twitter',
  x: 'twitter',
  tiktok: 'tiktok',
  pinterest: 'pinterest',
  reddit: 'reddit',
  whatsapp: 'whatsapp',
  wa: 'whatsapp',
  newsletter: 'email',
  email: 'email',
  mailchimp: 'email',
  klaviyo: 'email',
};

function hostToProvider(h: string): string {
  const clean = h.replace(/^www\./, '');
  for (const key of Object.keys(PROVIDER_ALIASES)) {
    if (clean.includes(key)) return PROVIDER_ALIASES[key]!;
  }
  // Fall back to the registrable-ish name (e.g. "example.com" -> "example").
  const parts = clean.split('.');
  return parts.length >= 2 ? parts[parts.length - 2]! : clean;
}

/**
 * The specific platform a lead came from: the utm_source (normalized), or the
 * referring site's name when no utm_source is present. Empty for direct visits.
 */
export function deriveProvider(input: AttributionInput): string {
  const src = (input.utmSource ?? '').trim().toLowerCase();
  if (src) return PROVIDER_ALIASES[src] ?? src;
  const ref = (input.referrer ?? '').trim();
  if (ref) return hostToProvider(host(ref));
  return '';
}
