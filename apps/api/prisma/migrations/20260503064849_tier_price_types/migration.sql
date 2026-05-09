-- Tier price types: FIXED vs PERCENTAGE.
CREATE TYPE "TierPriceType" AS ENUM ('FIXED', 'PERCENTAGE');

ALTER TABLE "TierPrice"
  ADD COLUMN "type" "TierPriceType" NOT NULL DEFAULT 'FIXED';
