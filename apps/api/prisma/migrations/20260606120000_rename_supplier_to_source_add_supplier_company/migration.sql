-- Rename the supplier-import domain. The old `Supplier` was really a
-- connection/integration the catalog is imported through; it becomes
-- `ProductSource`. A brand-new `Supplier` table models the real-world company
-- you order from (name + contact details). All renames are data-preserving
-- (ALTER ... RENAME), never drop/create, so existing rows survive.

-- 1) Enums -------------------------------------------------------------------
ALTER TYPE "SupplierKind" RENAME TO "SourceKind";
ALTER TYPE "SupplierAuthType" RENAME TO "SourceAuthType";
ALTER TYPE "SupplierImportFormat" RENAME TO "SourceImportFormat";
ALTER TYPE "SupplierImportRunStatus" RENAME TO "SourceImportRunStatus";
ALTER TYPE "SupplierImportTrigger" RENAME TO "SourceImportTrigger";

-- 2) Tables ------------------------------------------------------------------
ALTER TABLE "Supplier" RENAME TO "ProductSource";
ALTER TABLE "SupplierImport" RENAME TO "SourceImport";
ALTER TABLE "SupplierImportRun" RENAME TO "SourceImportRun";
ALTER TABLE "SupplierProductLink" RENAME TO "SourceProductLink";
ALTER TABLE "SupplierCategory" RENAME TO "SourceCategory";

-- 3) FK columns supplierId -> sourceId --------------------------------------
ALTER TABLE "SourceImport" RENAME COLUMN "supplierId" TO "sourceId";
ALTER TABLE "SourceProductLink" RENAME COLUMN "supplierId" TO "sourceId";
ALTER TABLE "SourceCategory" RENAME COLUMN "supplierId" TO "sourceId";

-- 4) Primary key constraints -------------------------------------------------
ALTER TABLE "ProductSource" RENAME CONSTRAINT "Supplier_pkey" TO "ProductSource_pkey";
ALTER TABLE "SourceImport" RENAME CONSTRAINT "SupplierImport_pkey" TO "SourceImport_pkey";
ALTER TABLE "SourceImportRun" RENAME CONSTRAINT "SupplierImportRun_pkey" TO "SourceImportRun_pkey";
ALTER TABLE "SourceProductLink" RENAME CONSTRAINT "SupplierProductLink_pkey" TO "SourceProductLink_pkey";
ALTER TABLE "SourceCategory" RENAME CONSTRAINT "SupplierCategory_pkey" TO "SourceCategory_pkey";

-- 5) Foreign key constraints -------------------------------------------------
ALTER TABLE "SourceImport" RENAME CONSTRAINT "SupplierImport_supplierId_fkey" TO "SourceImport_sourceId_fkey";
ALTER TABLE "SourceImportRun" RENAME CONSTRAINT "SupplierImportRun_importId_fkey" TO "SourceImportRun_importId_fkey";
ALTER TABLE "SourceProductLink" RENAME CONSTRAINT "SupplierProductLink_supplierId_fkey" TO "SourceProductLink_sourceId_fkey";
ALTER TABLE "SourceProductLink" RENAME CONSTRAINT "SupplierProductLink_productId_fkey" TO "SourceProductLink_productId_fkey";
ALTER TABLE "SourceCategory" RENAME CONSTRAINT "SupplierCategory_supplierId_fkey" TO "SourceCategory_sourceId_fkey";
ALTER TABLE "SourceCategory" RENAME CONSTRAINT "SupplierCategory_categoryId_fkey" TO "SourceCategory_categoryId_fkey";

-- 6) Indexes -----------------------------------------------------------------
ALTER INDEX "SupplierImport_supplierId_idx" RENAME TO "SourceImport_sourceId_idx";
ALTER INDEX "SupplierImportRun_importId_startedAt_idx" RENAME TO "SourceImportRun_importId_startedAt_idx";
ALTER INDEX "SupplierProductLink_supplierId_externalId_key" RENAME TO "SourceProductLink_sourceId_externalId_key";
ALTER INDEX "SupplierProductLink_productId_idx" RENAME TO "SourceProductLink_productId_idx";
ALTER INDEX "SupplierCategory_supplierId_externalId_key" RENAME TO "SourceCategory_sourceId_externalId_key";
ALTER INDEX "SupplierCategory_supplierId_categoryId_idx" RENAME TO "SourceCategory_sourceId_categoryId_idx";

-- 7) New Supplier (company) entity ------------------------------------------
CREATE TYPE "SupplierOrigin" AS ENUM ('MANUAL', 'FEED');

CREATE TABLE "Supplier" (
    "id"         TEXT NOT NULL,
    "sourceId"   TEXT NOT NULL,
    "origin"     "SupplierOrigin" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT NOT NULL DEFAULT '',
    "name"       TEXT NOT NULL,
    "phone"      TEXT,
    "altPhone"   TEXT,
    "tollFree"   TEXT,
    "website"    TEXT,
    "active"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_sourceId_externalId_key" ON "Supplier"("sourceId", "externalId");
CREATE INDEX "Supplier_sourceId_idx" ON "Supplier"("sourceId");

ALTER TABLE "Supplier"
    ADD CONSTRAINT "Supplier_sourceId_fkey"
    FOREIGN KEY ("sourceId") REFERENCES "ProductSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) Link each imported product to its real supplier ------------------------
ALTER TABLE "SourceProductLink" ADD COLUMN "supplierId" TEXT;
CREATE INDEX "SourceProductLink_supplierId_idx" ON "SourceProductLink"("supplierId");
ALTER TABLE "SourceProductLink"
    ADD CONSTRAINT "SourceProductLink_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
