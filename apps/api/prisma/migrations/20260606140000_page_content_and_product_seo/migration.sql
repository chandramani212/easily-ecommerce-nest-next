-- Per-product SEO overrides (empty = fall back to name/description).
ALTER TABLE "Product" ADD COLUMN "metaTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "metaDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "ogImage" TEXT;
ALTER TABLE "Product" ADD COLUMN "keywords" TEXT NOT NULL DEFAULT '';

-- Editable storefront page content + SEO (home / about / contact).
CREATE TABLE "Page" (
    "id"              TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "title"           TEXT NOT NULL DEFAULT '',
    "content"         JSONB NOT NULL DEFAULT '{}',
    "metaTitle"       TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "ogImage"         TEXT,
    "keywords"        TEXT NOT NULL DEFAULT '',
    "canonicalUrl"    TEXT NOT NULL DEFAULT '',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
