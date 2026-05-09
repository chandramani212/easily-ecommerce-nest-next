-- Supplier imports (Phase 1).
CREATE TYPE "SupplierKind" AS ENUM ('REST', 'FILE_FEED');
CREATE TYPE "SupplierAuthType" AS ENUM ('NONE', 'API_KEY', 'BASIC', 'BEARER', 'OAUTH2_CLIENT_CREDENTIALS');
CREATE TYPE "SupplierImportFormat" AS ENUM ('JSON', 'XML', 'CSV');
CREATE TYPE "SupplierImportRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');
CREATE TYPE "SupplierImportTrigger" AS ENUM ('SCHEDULE', 'MANUAL');

CREATE TABLE "Supplier" (
  "id"               TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "kind"             "SupplierKind" NOT NULL DEFAULT 'REST',
  "baseUrl"          TEXT,
  "authType"         "SupplierAuthType" NOT NULL DEFAULT 'NONE',
  "authSecret"       TEXT,
  "defaultMarkupPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "notes"            TEXT NOT NULL DEFAULT '',
  "active"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierImport" (
  "id"                    TEXT NOT NULL,
  "supplierId"            TEXT NOT NULL,
  "name"                  TEXT NOT NULL,
  "format"                "SupplierImportFormat" NOT NULL DEFAULT 'JSON',
  "endpoint"              TEXT,
  "httpMethod"            TEXT NOT NULL DEFAULT 'GET',
  "headers"               JSONB NOT NULL DEFAULT '{}'::jsonb,
  "body"                  TEXT,
  "recordsPath"           TEXT NOT NULL DEFAULT '$',
  "mapping"               JSONB NOT NULL DEFAULT '{}'::jsonb,
  "markup"                JSONB NOT NULL DEFAULT '{}'::jsonb,
  "cron"                  TEXT NOT NULL DEFAULT '',
  "active"                BOOLEAN NOT NULL DEFAULT true,
  "sampleFilename"        TEXT,
  "sampleMime"            TEXT,
  "autoDeactivateMissing" BOOLEAN NOT NULL DEFAULT false,
  "lastRunAt"             TIMESTAMP(3),
  "lastStatus"            "SupplierImportRunStatus",
  "lastRunId"             TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierImport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplierImport_supplierId_idx" ON "SupplierImport"("supplierId");

CREATE TABLE "SupplierImportRun" (
  "id"          TEXT NOT NULL,
  "importId"    TEXT NOT NULL,
  "status"      "SupplierImportRunStatus" NOT NULL DEFAULT 'RUNNING',
  "triggeredBy" "SupplierImportTrigger" NOT NULL DEFAULT 'MANUAL',
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"  TIMESTAMP(3),
  "created"     INTEGER NOT NULL DEFAULT 0,
  "updated"     INTEGER NOT NULL DEFAULT 0,
  "skipped"     INTEGER NOT NULL DEFAULT 0,
  "failed"      INTEGER NOT NULL DEFAULT 0,
  "errors"      JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT "SupplierImportRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplierImportRun_importId_startedAt_idx"
  ON "SupplierImportRun"("importId", "startedAt");

CREATE TABLE "SupplierProductLink" (
  "id"         TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "productId"  TEXT NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierProductLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierProductLink_supplierId_externalId_key"
  ON "SupplierProductLink"("supplierId", "externalId");
CREATE INDEX "SupplierProductLink_productId_idx"
  ON "SupplierProductLink"("productId");

ALTER TABLE "SupplierImport"
  ADD CONSTRAINT "SupplierImport_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierImportRun"
  ADD CONSTRAINT "SupplierImportRun_importId_fkey"
  FOREIGN KEY ("importId") REFERENCES "SupplierImport"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierProductLink"
  ADD CONSTRAINT "SupplierProductLink_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupplierProductLink"
  ADD CONSTRAINT "SupplierProductLink_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
