-- Admin-editable lead sources (was hard-coded in lead-source.util.ts).
ALTER TABLE "Inquiry" ADD COLUMN "utmSource" TEXT NOT NULL DEFAULT '';

CREATE TABLE "LeadSource" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "organic" BOOLEAN NOT NULL DEFAULT true,
    "hosts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "utmSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "utmMediums" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("key")
);

-- The previous hard-coded rules, unchanged, plus AI search assistants.
-- AI Search sits above organic search so gemini.google.com isn't read as Google.
INSERT INTO "LeadSource" ("key", "label", "organic", "hosts", "utmSources", "utmMediums", "priority", "system") VALUES
('paid', 'Paid', false, ARRAY[]::TEXT[], ARRAY['adwords','gclid'],
  ARRAY['cpc','ppc','paid','paidsearch','paid-search','paidsocial','paid-social','display','cpm','banner','retargeting'], 10, false),
('email', 'Email', false, ARRAY[]::TEXT[], ARRAY['email','newsletter','mailchimp','klaviyo','sendgrid'],
  ARRAY['email','e-mail','newsletter'], 20, false),
('ai-search', 'AI Search', true,
  ARRAY['chatgpt.com','chat.openai.com','openai.com','perplexity.ai','gemini.google.com','bard.google.com','copilot.microsoft.com','copilot.cloud.microsoft','claude.ai','meta.ai','you.com','phind.com','deepseek.com','grok.com','poe.com','mistral.ai'],
  ARRAY['chatgpt','chatgpt.com','openai','perplexity','gemini','copilot','claude','meta-ai','deepseek','grok'],
  ARRAY['ai','ai-search','llm'], 25, false),
('social', 'Social', true,
  ARRAY['facebook.','instagram.','twitter.','x.com','t.co','linkedin.','lnkd.in','youtube.','pinterest.','tiktok.','reddit.','wa.me','whatsapp'],
  ARRAY[]::TEXT[], ARRAY['social','social-organic','sm','social-media'], 30, false),
('organic', 'Organic search', true,
  ARRAY['google.','bing.','yahoo.','duckduckgo.','ecosia.','baidu.','yandex.'],
  ARRAY[]::TEXT[], ARRAY['organic'], 40, false),
('referral', 'Referral', true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY['referral'], 900, true),
('direct', 'Direct', true, ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 1000, true);
