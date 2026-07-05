-- Add optional banner image and long-form content to Category.
ALTER TABLE "Category" ADD COLUMN "bannerImage" TEXT;
ALTER TABLE "Category" ADD COLUMN "content" TEXT;
