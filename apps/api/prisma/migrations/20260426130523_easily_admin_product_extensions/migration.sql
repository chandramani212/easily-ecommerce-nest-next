-- Easily Admin: product extensions + media library
-- 1. New product columns
ALTER TABLE "Product"
  ADD COLUMN "shortDescription" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "sellingPrice"     DECIMAL(12,2),
  ADD COLUMN "attributes"       JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill sellingPrice from existing basePrice so the new column can become NOT NULL.
UPDATE "Product" SET "sellingPrice" = "basePrice" WHERE "sellingPrice" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "sellingPrice" SET NOT NULL;

-- 2. Move single-category relation to a many-to-many implicit join table.
CREATE TABLE "_ProductCategories" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ProductCategories_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");

-- Carry existing single-category assignments forward.
INSERT INTO "_ProductCategories" ("A","B")
SELECT "categoryId", "id"
FROM "Product"
WHERE "categoryId" IS NOT NULL;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE "Product" DROP COLUMN "categoryId";

ALTER TABLE "_ProductCategories"
  ADD CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A")
    REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ADD CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B")
    REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,

-- 3. Self-referential many-to-many for related products.
CREATE TABLE "_RelatedProducts" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_RelatedProducts_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_RelatedProducts_B_index" ON "_RelatedProducts"("B");

ALTER TABLE "_RelatedProducts"
  ADD CONSTRAINT "_RelatedProducts_A_fkey" FOREIGN KEY ("A")
    REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_RelatedProducts_B_fkey" FOREIGN KEY ("B")
    REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Media library.
CREATE TABLE "MediaAsset" (
  "id"           TEXT NOT NULL,
  "filename"     TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "url"          TEXT NOT NULL,
  "mimeType"     TEXT NOT NULL,
  "size"         INTEGER NOT NULL,
  "width"        INTEGER,
  "height"       INTEGER,
  "alt"          TEXT,
  "uploadedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAsset_filename_key" ON "MediaAsset"("filename");
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
