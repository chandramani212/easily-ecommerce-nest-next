-- Lead-source attribution on inquiries (the leads).
ALTER TABLE "Inquiry" ADD COLUMN "source"   TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE "Inquiry" ADD COLUMN "organic"  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Inquiry" ADD COLUMN "medium"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "Inquiry" ADD COLUMN "campaign" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Inquiry" ADD COLUMN "referrer" TEXT NOT NULL DEFAULT '';

CREATE INDEX "Inquiry_source_idx" ON "Inquiry"("source");
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");
