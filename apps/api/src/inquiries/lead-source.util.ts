/**
 * Classify a lead's acquisition source from UTM params + referrer. The buckets
 * and their matching rules live in the LeadSource table (editable from the
 * admin); this module stays pure — rules in, classification out — so it is
 * easy to test and to re-run over existing leads.
 */

export interface AttributionInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
}

export interface ClassifiedSource {
  source: string;
  organic: boolean;
}

/** The subset of a LeadSource row the classifier needs. */
export interface LeadSourceRule {
  key: string;
  organic: boolean;
  hosts: string[];
  utmSources: string[];
  utmMediums: string[];
  priority: number;
  active: boolean;
}

/** Fallback buckets (system rows) used when no rule matches. */
export const REFERRAL = 'referral';
export const DIRECT = 'direct';

/**
 * Does `value` (a host or utm_source) contain the rule fragment `frag` on a
 * domain-label boundary? "facebook." matches m.facebook.com, "t.co" matches
 * t.co but not chatgpt.com, "x.com" matches x.com but not box.com.
 */
export function matchesHost(value: string, frag: string): boolean {
  if (!value || !frag) return false;
  for (let i = value.indexOf(frag); i !== -1; i = value.indexOf(frag, i + 1)) {
    const before = i === 0 || value[i - 1] === '.';
    const end = i + frag.length;
    const after = frag.endsWith('.') || end === value.length || value[end] === '.';
    if (before && after) return true;
  }
  return false;
}

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * First active rule (lowest priority number) that matches wins:
 *  - utm_medium equals one of `utmMediums`, or
 *  - utm_source equals one of `utmSources`, or
 *  - utm_source or the referrer host contains one of `hosts`.
 * No match → "referral" when there is any referrer / utm_source, else "direct".
 */
export function classifyLeadSource(
  input: AttributionInput,
  rules: readonly LeadSourceRule[],
): ClassifiedSource {
  const src = (input.utmSource ?? '').trim().toLowerCase();
  const medium = (input.utmMedium ?? '').trim().toLowerCase();
  const ref = (input.referrer ?? '').trim();
  const refHost = ref ? host(ref) : '';

  const ordered = rules
    .filter((r) => r.active)
    .sort((a, b) => a.priority - b.priority);

  for (const r of ordered) {
    const hit =
      (medium && r.utmMediums.includes(medium)) ||
      (src && r.utmSources.includes(src)) ||
      r.hosts.some((h) => matchesHost(src, h) || matchesHost(refHost, h));
    if (hit) return { source: r.key, organic: r.organic };
  }

  const fallback = refHost || src ? REFERRAL : DIRECT;
  const row = rules.find((r) => r.key === fallback);
  return { source: fallback, organic: row?.organic ?? true };
}

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
  // AI assistants
  chatgpt: 'chatgpt',
  'chat.openai': 'chatgpt',
  openai: 'chatgpt',
  perplexity: 'perplexity',
  gemini: 'gemini',
  bard: 'gemini',
  copilot: 'copilot',
  claude: 'claude',
  'meta.ai': 'meta-ai',
  'meta-ai': 'meta-ai',
  deepseek: 'deepseek',
  grok: 'grok',
  phind: 'phind',
  'you.com': 'you',
};

function hostToProvider(h: string): string {
  const clean = h.replace(/^www\./, '');
  // Multi-label aliases first ("chat.openai", "meta.ai"), then the leftmost
  // known label — the most specific part of the host — so gemini.google.com
  // is "gemini", not "google".
  for (const key of Object.keys(PROVIDER_ALIASES)) {
    if (key.includes('.') && matchesHost(clean, key)) return PROVIDER_ALIASES[key]!;
  }
  const labels = clean.split('.');
  for (const label of labels) {
    if (PROVIDER_ALIASES[label]) return PROVIDER_ALIASES[label]!;
  }
  // Fall back to the registrable-ish name (e.g. "example.com" -> "example").
  return labels.length >= 2 ? labels[labels.length - 2]! : clean;
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
