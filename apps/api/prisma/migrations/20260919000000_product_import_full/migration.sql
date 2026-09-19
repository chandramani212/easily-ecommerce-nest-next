-- Full product spreadsheet import: job kind + per-row validated diff.
ALTER TABLE "ProductImportJob" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CATEGORY';
ALTER TABLE "ProductImportRow" ADD COLUMN "action" TEXT;
ALTER TABLE "ProductImportRow" ADD COLUMN "data" JSONB;
