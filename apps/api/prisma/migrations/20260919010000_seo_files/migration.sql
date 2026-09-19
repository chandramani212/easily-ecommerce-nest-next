-- Sitemaps + Google Merchant feed: site URL/brand settings and generated-file bookkeeping.
ALTER TABLE "Settings" ADD COLUMN "siteUrl" TEXT NOT NULL DEFAULT 'https://easilybranded.com';
ALTER TABLE "Settings" ADD COLUMN "feedBrand" TEXT NOT NULL DEFAULT 'Easily Branded';

CREATE TABLE "SeoFile" (
    "key" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "items" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SeoFile_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "SeoTarget" (
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    CONSTRAINT "SeoTarget_pkey" PRIMARY KEY ("target")
);
