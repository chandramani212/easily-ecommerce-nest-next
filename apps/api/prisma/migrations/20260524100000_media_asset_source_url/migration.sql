-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_sourceUrl_key" ON "MediaAsset"("sourceUrl");
