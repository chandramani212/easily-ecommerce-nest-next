-- CreateEnum
CREATE TYPE "ProductImportJobStatus" AS ENUM ('PARSING', 'VALIDATING', 'VALIDATED', 'APPLYING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProductImportJob" (
    "id" TEXT NOT NULL,
    "status" "ProductImportJobStatus" NOT NULL DEFAULT 'PARSING',
    "filename" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT '',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "changed" INTEGER NOT NULL DEFAULT 0,
    "unchanged" INTEGER NOT NULL DEFAULT 0,
    "invalid" INTEGER NOT NULL DEFAULT 0,
    "report" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "createdById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ProductImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImportRow" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowNum" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "l1" TEXT NOT NULL,
    "l2" TEXT NOT NULL,
    "l3" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "problem" TEXT,

    CONSTRAINT "ProductImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImportJob_startedAt_idx" ON "ProductImportJob"("startedAt");

-- CreateIndex
CREATE INDEX "ProductImportRow_jobId_rowNum_idx" ON "ProductImportRow"("jobId", "rowNum");

-- CreateIndex
CREATE INDEX "ProductImportRow_jobId_problem_idx" ON "ProductImportRow"("jobId", "problem");

-- AddForeignKey
ALTER TABLE "ProductImportJob" ADD CONSTRAINT "ProductImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImportRow" ADD CONSTRAINT "ProductImportRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Staging rows are throwaway and deleted as soon as a job completes: skip WAL
-- for them so a 130k-row upload stages fast.
ALTER TABLE "ProductImportRow" SET UNLOGGED;
