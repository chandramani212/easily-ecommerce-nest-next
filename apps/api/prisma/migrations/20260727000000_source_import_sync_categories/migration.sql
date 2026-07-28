-- Per-import toggle: when false, a sync leaves an existing product's curated
-- categories alone so manual category edits survive re-runs.
ALTER TABLE "SourceImport" ADD COLUMN "syncCategories" BOOLEAN NOT NULL DEFAULT true;
