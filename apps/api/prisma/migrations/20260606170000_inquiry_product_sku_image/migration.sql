-- The product a lead is about, captured from the storefront enquiry link.
ALTER TABLE "Inquiry" ADD COLUMN "productSku" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "productImage" TEXT;
