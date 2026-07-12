-- Add per-run downloaded-details counter (fetch-phase progress).
ALTER TABLE "SourceImportRun" ADD COLUMN "fetched" INTEGER NOT NULL DEFAULT 0;
