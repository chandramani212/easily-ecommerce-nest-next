-- Add per-run total records counter (progress bar denominator).
ALTER TABLE "SourceImportRun" ADD COLUMN "total" INTEGER NOT NULL DEFAULT 0;
