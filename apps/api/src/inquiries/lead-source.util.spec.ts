import { describe, expect, it } from '@jest/globals';

import {
  classifyLeadSource,
  deriveProvider,
  type LeadSourceRule,
} from './lead-source.util';

/** Mirrors the rows seeded by migration 20260919020000_lead_sources. */
const RULES: LeadSourceRule[] = [
  { key: 'paid', organic: false, hosts: [], utmSources: ['adwords', 'gclid'], utmMediums: ['cpc', 'ppc', 'paid', 'display'], priority: 10, active: true },
  { key: 'email', organic: false, hosts: [], utmSources: ['newsletter', 'mailchimp'], utmMediums: ['email'], priority: 20, active: true },
  { key: 'ai-search', organic: true, hosts: ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'claude.ai'], utmSources: ['chatgpt', 'chatgpt.com', 'perplexity'], utmMediums: ['ai'], priority: 25, active: true },
  { key: 'social', organic: true, hosts: ['facebook.', 'linkedin.', 't.co'], utmSources: [], utmMediums: ['social'], priority: 30, active: true },
  { key: 'organic', organic: true, hosts: ['google.', 'bing.', 'yahoo.'], utmSources: [], utmMediums: ['organic'], priority: 40, active: true },
  { key: 'referral', organic: true, hosts: [], utmSources: [], utmMediums: ['referral'], priority: 900, active: true },
  { key: 'direct', organic: true, hosts: [], utmSources: [], utmMediums: [], priority: 1000, active: true },
];

const classify = (i: Parameters<typeof classifyLeadSource>[0]) =>
  classifyLeadSource(i, RULES).source;

describe('classifyLeadSource', () => {
  it('keeps the original buckets', () => {
    expect(classify({ utmSource: 'google', utmMedium: 'cpc' })).toBe('paid');
    expect(classifyLeadSource({ utmMedium: 'cpc' }, RULES).organic).toBe(false);
    expect(classify({ utmMedium: 'email' })).toBe('email');
    expect(classify({ referrer: 'https://www.facebook.com/' })).toBe('social');
    expect(classify({ referrer: 'https://www.google.com/' })).toBe('organic');
    expect(classify({ referrer: 'https://someblog.example/post' })).toBe('referral');
    expect(classify({})).toBe('direct');
  });

  it('recognises AI assistants, including ones hosted on search domains', () => {
    expect(classify({ referrer: 'https://chatgpt.com/' })).toBe('ai-search');
    expect(classify({ utmSource: 'chatgpt.com' })).toBe('ai-search');
    expect(classify({ referrer: 'https://www.perplexity.ai/search?q=x' })).toBe('ai-search');
    expect(classify({ referrer: 'https://gemini.google.com/app' })).toBe('ai-search');
    expect(classify({ referrer: 'https://copilot.microsoft.com/' })).toBe('ai-search');
    expect(classifyLeadSource({ referrer: 'https://claude.ai/' }, RULES).organic).toBe(true);
  });

  it('paid still beats an AI referrer', () => {
    expect(classify({ referrer: 'https://chatgpt.com/', utmMedium: 'cpc' })).toBe('paid');
  });

  it('skips inactive rules', () => {
    const off = RULES.map((r) => (r.key === 'ai-search' ? { ...r, active: false } : r));
    expect(classifyLeadSource({ referrer: 'https://chatgpt.com/' }, off).source).toBe('referral');
    expect(classifyLeadSource({ referrer: 'https://gemini.google.com/' }, off).source).toBe('organic');
  });
});

describe('deriveProvider', () => {
  it('names AI platforms', () => {
    expect(deriveProvider({ referrer: 'https://chatgpt.com/' })).toBe('chatgpt');
    expect(deriveProvider({ referrer: 'https://gemini.google.com/app' })).toBe('gemini');
    expect(deriveProvider({ referrer: 'https://www.perplexity.ai/' })).toBe('perplexity');
    expect(deriveProvider({ referrer: 'https://copilot.microsoft.com/' })).toBe('copilot');
  });

  it('keeps existing platforms and no longer lets "x" match any host', () => {
    expect(deriveProvider({ referrer: 'https://www.google.com/' })).toBe('google');
    expect(deriveProvider({ referrer: 'https://m.facebook.com/' })).toBe('facebook');
    expect(deriveProvider({ referrer: 'https://x.com/' })).toBe('twitter');
    expect(deriveProvider({ referrer: 'https://www.example.com/' })).toBe('example');
    expect(deriveProvider({ utmSource: 'fb' })).toBe('facebook');
    expect(deriveProvider({})).toBe('');
  });
});

describe('host matching', () => {
  it('no longer lets t.co claim chatgpt.com', () => {
    const socialOnly = RULES.filter((r) => r.key !== 'ai-search');
    expect(classifyLeadSource({ referrer: 'https://chatgpt.com/' }, socialOnly).source).toBe('referral');
    expect(classifyLeadSource({ referrer: 'https://t.co/abc' }, RULES).source).toBe('social');
    expect(classifyLeadSource({ referrer: 'https://in.linkedin.com/' }, RULES).source).toBe('social');
    expect(classifyLeadSource({ referrer: 'https://www.google.co.in/' }, RULES).source).toBe('organic');
  });
});
