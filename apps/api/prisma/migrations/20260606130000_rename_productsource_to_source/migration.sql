-- Rename the connection table `ProductSource` -> `Source` for consistency with
-- the rest of the Source* family. Data-preserving: foreign keys on child tables
-- (SourceImport, SourceProductLink, SourceCategory, Supplier) reference this
-- table by identity, so they remain valid across the rename. Only the table and
-- its primary-key constraint need renaming.

ALTER TABLE "ProductSource" RENAME TO "Source";
ALTER TABLE "Source" RENAME CONSTRAINT "ProductSource_pkey" TO "Source_pkey";
