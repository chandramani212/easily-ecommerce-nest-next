-- Specific platform a lead came from (google/yahoo/facebook/...), derived from
-- utm_source or the referrer host.
ALTER TABLE "Inquiry" ADD COLUMN "provider" TEXT NOT NULL DEFAULT '';
