import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductImportJobStatus, Prisma } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';

import { PrismaService } from '../../prisma/prisma.service';
import {
  BULK_FIELDS,
  SKU_COLUMN,
  mapHeaders,
  normalizeCell,
  slugifyName,
} from './bulk-columns';

/** Staged rows inserted per statement. */
const STAGE_BATCH = 5_000;
/** Rows whose links are rewritten per statement during apply. */
const APPLY_BATCH = 10_000;
/** Cap on how many individual problems / new categories the report carries. */
const REPORT_CAP = 200;

export interface ReportProblem {
  row: number;
  sku: string;
  error: string;
}

export interface ReportNewCategory {
  l1: string;
  l2: string;
  l3: string;
  /** Shallowest level that does not exist yet. */
  createFrom: 'L1' | 'L2' | 'L3';
}

export interface ImportReport {
  problems: ReportProblem[];
  problemsTruncated: boolean;
  newCategories: ReportNewCategory[];
  newCategoriesTruncated: boolean;
  /** Categories created by the apply phase. Absent until applied. */
  createdCategories?: number;
  /** Categories left holding no products after the apply. Absent until applied. */
  emptyCategories?: number;
}

@Injectable()
export class ProductBulkImportService {
  private readonly log = new Logger(ProductBulkImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- queries

  async get(id: string) {
    const job = await this.prisma.productImportJob.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, email: true } } },
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  async list(limit = 20) {
    return this.prisma.productImportJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 100),
      include: { createdBy: { select: { name: true, email: true } } },
    });
  }

  // ------------------------------------------------------- upload / confirm

  /**
   * Accept an upload and return immediately with a job the client can poll.
   * Parsing, staging and validation all run in the background so a 130k-row
   * sheet never sits on an HTTP request, and so the admin gets a real progress
   * bar rather than a spinner.
   *
   * Nothing in this phase writes to Product or Category.
   */
  async createJob(
    filename: string,
    csv: string,
    userId: string | null,
  ): Promise<{ id: string }> {
    // Header check runs synchronously so a mis-shaped file fails loudly at
    // upload time rather than as a background job the user has to go find.
    const columns = this.readHeader(csv);

    const job = await this.prisma.productImportJob.create({
      data: {
        filename,
        status: ProductImportJobStatus.PARSING,
        phase: 'Reading file',
        createdById: userId,
      },
      select: { id: true },
    });

    void this.runValidation(job.id, csv, columns).catch((err: unknown) => {
      this.log.error(`Validation failed for job ${job.id}`, err);
      return this.fail(job.id, err);
    });

    return { id: job.id };
  }

  /** Confirm a VALIDATED job. Returns immediately; progress is polled. */
  async applyJob(id: string): Promise<{ id: string }> {
    const job = await this.prisma.productImportJob.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!job) throw new NotFoundException('Import job not found');
    if (job.status !== ProductImportJobStatus.VALIDATED) {
      throw new BadRequestException(
        `Job is ${job.status}; only a validated job can be applied.`,
      );
    }

    await this.prisma.productImportJob.update({
      where: { id },
      data: {
        status: ProductImportJobStatus.APPLYING,
        phase: 'Starting',
        processed: 0,
      },
    });

    void this.runApply(id).catch((err: unknown) => {
      this.log.error(`Apply failed for job ${id}`, err);
      return this.fail(id, err);
    });

    return { id };
  }

  /** Discard a job that has not been applied, freeing its staged rows. */
  async cancelJob(id: string) {
    const job = await this.prisma.productImportJob.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!job) throw new NotFoundException('Import job not found');
    if (
      job.status === ProductImportJobStatus.APPLYING ||
      job.status === ProductImportJobStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Cannot cancel a job that is ${job.status.toLowerCase()}.`,
      );
    }
    await this.prisma.productImportRow.deleteMany({ where: { jobId: id } });
    return this.prisma.productImportJob.update({
      where: { id },
      data: {
        status: ProductImportJobStatus.CANCELLED,
        phase: 'Cancelled',
        finishedAt: new Date(),
      },
    });
  }

  // ------------------------------------------------------------- validation

  /** Verify the header row carries everything the category import needs. */
  private readHeader(csv: string): (string | null)[] {
    const nl = csv.indexOf('\n');
    const firstLine = nl === -1 ? csv : csv.slice(0, nl);
    const header = csvParse(firstLine.replace(/^﻿/, ''), {
      skip_empty_lines: true,
    }) as string[][];
    const cells = header[0];
    if (!cells?.length) {
      throw new BadRequestException('The file has no header row.');
    }

    const columns = mapHeaders(cells);
    const missing = [SKU_COLUMN, ...BULK_FIELDS.categories.required].filter(
      (c) => !columns.includes(c),
    );
    if (missing.length) {
      throw new BadRequestException(
        `Missing required column(s): ${missing.join(', ')}. ` +
          `Found: ${cells.filter(Boolean).join(', ')}. ` +
          'Export the products first to get a file with the right headers.',
      );
    }
    return columns;
  }

  private async runValidation(
    jobId: string,
    csv: string,
    columns: (string | null)[],
  ): Promise<void> {
    const records = csvParse(csv.replace(/^﻿/, ''), {
      skip_empty_lines: true,
      relax_column_count: true,
      from_line: 2, // the header was consumed by readHeader
    }) as string[][];

    const iSku = columns.indexOf(SKU_COLUMN);
    const iL1 = columns.indexOf('categoryL1');
    const iL2 = columns.indexOf('categoryL2');
    const iL3 = columns.indexOf('categoryL3');

    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: { total: records.length, phase: 'Checking catalogue', processed: 0 },
    });

    // Resolution happens in memory against two lookups loaded once: SKU →
    // product and (parent, name) → category. Doing it in SQL instead meant
    // joining 130k staged rows to a paths CTE on three text columns, whose plan
    // flipped between a hash join and a nested loop — seconds one run, minutes
    // the next. Here the cost is linear and predictable.
    const productBySku = await this.loadProductIndex();
    const categoryIndex = await this.loadNameIndex();

    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: { phase: 'Staging rows' },
    });

    const seenSku = new Set<string>();

    // One statement per 5k rows via unnest, rather than one INSERT per row.
    for (let start = 0; start < records.length; start += STAGE_BATCH) {
      const slice = records.slice(start, start + STAGE_BATCH);
      const rowNums: number[] = [];
      const skus: string[] = [];
      const l1s: string[] = [];
      const l2s: string[] = [];
      const l3s: string[] = [];
      const productIds: (string | null)[] = [];
      const categoryIds: (string | null)[] = [];
      const problems: (string | null)[] = [];

      slice.forEach((rec, i) => {
        const sku = normalizeCell(rec[iSku]);
        const l1 = normalizeCell(rec[iL1]);
        const l2 = normalizeCell(rec[iL2]);
        const l3 = normalizeCell(rec[iL3]);
        const dupKey = sku.toLowerCase();
        const productId = productBySku.get(sku) ?? null;

        let problem: string | null = null;
        if (!sku) problem = 'Blank SKU';
        else if (seenSku.has(dupKey))
          problem = 'Duplicate SKU — only the first row is applied';
        else if (!productId) problem = 'No product with this SKU';
        else if (!l1 || !l2 || !l3) problem = 'Category path is incomplete';
        if (sku) seenSku.add(dupKey);

        // Null when the path does not exist yet; those become the
        // "will be created" list and are filled in during apply.
        const id1 = l1 ? categoryIndex.get(this.key(null, l1)) : undefined;
        const id2 = id1 && l2 ? categoryIndex.get(this.key(id1, l2)) : undefined;
        const id3 = id2 && l3 ? categoryIndex.get(this.key(id2, l3)) : undefined;

        rowNums.push(start + i + 2); // +2: 1-based line numbers, header at 1
        skus.push(sku);
        l1s.push(l1);
        l2s.push(l2);
        l3s.push(l3);
        productIds.push(productId);
        categoryIds.push(id3 ?? null);
        problems.push(problem);
      });

      await this.prisma.$executeRaw`
        INSERT INTO "ProductImportRow" (
          "jobId", "rowNum", sku, l1, l2, l3, "productId", "categoryId", problem
        )
        SELECT ${jobId}, * FROM unnest(
          ${rowNums}::int[], ${skus}::text[],
          ${l1s}::text[], ${l2s}::text[], ${l3s}::text[],
          ${productIds}::text[], ${categoryIds}::text[], ${problems}::text[]
        )`;

      await this.prisma.productImportJob.update({
        where: { id: jobId },
        data: { processed: Math.min(start + STAGE_BATCH, records.length) },
      });
    }

    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: ProductImportJobStatus.VALIDATING,
        phase: 'Checking rows',
        processed: 0,
      },
    });

    const { report, counts } = await this.buildReport(jobId);

    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: ProductImportJobStatus.VALIDATED,
        phase: 'Ready to apply',
        processed: counts.total,
        changed: counts.changed,
        unchanged: counts.unchanged,
        invalid: counts.invalid,
        report: report as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Everything the admin confirms against, read straight off the resolved
   * columns. Reads only; nothing is written.
   */
  private async buildReport(jobId: string) {
    const [counts] = await this.prisma.$queryRaw<
      { total: bigint; invalid: bigint; changed: bigint; unchanged: bigint }[]
    >`
      WITH cur AS (
        SELECT pc."B" AS product_id, count(*) AS n, min(pc."A") AS only_id
        FROM "_ProductCategories" pc GROUP BY pc."B"
      )
      SELECT count(*)                                    AS total,
             count(*) FILTER (WHERE rw.problem IS NOT NULL) AS invalid,
             count(*) FILTER (
               WHERE rw.problem IS NULL
                 AND rw."categoryId" IS NOT NULL
                 AND cur.n = 1 AND cur.only_id = rw."categoryId"
             )                                           AS unchanged,
             count(*) FILTER (
               WHERE rw.problem IS NULL
                 AND (rw."categoryId" IS NULL
                      OR cur.n IS DISTINCT FROM 1
                      OR cur.only_id IS DISTINCT FROM rw."categoryId")
             )                                           AS changed
      FROM "ProductImportRow" rw
      LEFT JOIN cur ON cur.product_id = rw."productId"
      WHERE rw."jobId" = ${jobId}`;

    const problems = await this.prisma.$queryRaw<
      { rowNum: number; sku: string; problem: string }[]
    >`
      SELECT "rowNum", sku, problem FROM "ProductImportRow"
      WHERE "jobId" = ${jobId} AND problem IS NOT NULL
      ORDER BY "rowNum" LIMIT ${REPORT_CAP + 1}`;

    const newPaths = await this.prisma.$queryRaw<
      { l1: string; l2: string; l3: string }[]
    >`
      SELECT DISTINCT l1, l2, l3 FROM "ProductImportRow"
      WHERE "jobId" = ${jobId} AND problem IS NULL AND "categoryId" IS NULL
      ORDER BY l1, l2, l3 LIMIT ${REPORT_CAP + 1}`;

    // Which level is the shallowest missing one — resolved against the live
    // tree (a few hundred rows) rather than another pass over the staged rows.
    const tree = await this.loadNameIndex();
    const newCategories: ReportNewCategory[] = newPaths
      .slice(0, REPORT_CAP)
      .map((p) => {
        const id1 = tree.get(this.key(null, p.l1));
        const id2 = id1 ? tree.get(this.key(id1, p.l2)) : undefined;
        return {
          ...p,
          createFrom: !id1 ? 'L1' : !id2 ? 'L2' : 'L3',
        };
      });

    const report: ImportReport = {
      problems: problems.slice(0, REPORT_CAP).map((p) => ({
        row: p.rowNum,
        sku: p.sku,
        error: p.problem,
      })),
      problemsTruncated: problems.length > REPORT_CAP,
      newCategories,
      newCategoriesTruncated: newPaths.length > REPORT_CAP,
    };

    return {
      report,
      counts: {
        total: Number(counts?.total ?? 0),
        invalid: Number(counts?.invalid ?? 0),
        changed: Number(counts?.changed ?? 0),
        unchanged: Number(counts?.unchanged ?? 0),
      },
    };
  }

  // ------------------------------------------------------------------ apply

  private async runApply(jobId: string): Promise<void> {
    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: { phase: 'Creating missing categories' },
    });
    const createdCategories = await this.createMissingCategories(jobId);

    const job = await this.prisma.productImportJob.findUniqueOrThrow({
      where: { id: jobId },
      select: { total: true },
    });

    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: { phase: 'Updating product categories', processed: 0 },
    });

    const [bounds] = await this.prisma.$queryRaw<
      { lo: number | null; hi: number | null }[]
    >`SELECT min("rowNum") AS lo, max("rowNum") AS hi
      FROM "ProductImportRow" WHERE "jobId" = ${jobId}`;
    const lo = bounds?.lo ?? 0;
    const hi = bounds?.hi ?? -1;

    // Walk the staged rows in rowNum windows: every write stays set-based
    // while the progress bar still moves.
    for (let from = lo; from <= hi; from += APPLY_BATCH) {
      const to = Math.min(from + APPLY_BATCH - 1, hi);

      // Only rows that resolved cleanly take part. An unknown SKU or a blank
      // path must never reach the DELETE — otherwise one bad cell in the sheet
      // would silently strip a product's categories.
      await this.prisma.$executeRaw`
        DELETE FROM "_ProductCategories" pc
        USING "ProductImportRow" rw
        WHERE rw."jobId" = ${jobId}
          AND rw.problem IS NULL
          AND rw."categoryId" IS NOT NULL
          AND rw."rowNum" BETWEEN ${from} AND ${to}
          AND pc."B" = rw."productId"`;

      await this.prisma.$executeRaw`
        INSERT INTO "_ProductCategories" ("A", "B")
        SELECT DISTINCT rw."categoryId", rw."productId"
        FROM "ProductImportRow" rw
        WHERE rw."jobId" = ${jobId}
          AND rw.problem IS NULL
          AND rw."categoryId" IS NOT NULL
          AND rw."rowNum" BETWEEN ${from} AND ${to}
        ON CONFLICT DO NOTHING`;

      await this.prisma.productImportJob.update({
        where: { id: jobId },
        data: { processed: Math.min(to - lo + 1, job.total) },
      });
    }

    // Reported, not acted on: whether an empty category should be hidden is
    // the admin's call, so `active` is left exactly as they set it.
    const [empty] = await this.prisma.$queryRaw<{ count: bigint }[]>`
      WITH RECURSIVE tree AS (
        SELECT id, id AS root FROM "Category"
        UNION ALL
        SELECT c.id, t.root FROM "Category" c JOIN tree t ON c."parentId" = t.id
      ),
      filled AS (
        SELECT DISTINCT t.root AS id
        FROM tree t JOIN "_ProductCategories" pc ON pc."A" = t.id
      )
      SELECT count(*) AS count FROM "Category" c
      WHERE NOT EXISTS (SELECT 1 FROM filled f WHERE f.id = c.id)`;

    const existing = await this.prisma.productImportJob.findUniqueOrThrow({
      where: { id: jobId },
      select: { report: true },
    });
    const report: ImportReport = {
      ...(existing.report as unknown as ImportReport),
      createdCategories,
      emptyCategories: Number(empty?.count ?? 0),
    };

    await this.prisma.productImportRow.deleteMany({ where: { jobId } });
    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: ProductImportJobStatus.COMPLETED,
        phase: 'Done',
        processed: job.total,
        finishedAt: new Date(),
        report: report as unknown as Prisma.InputJsonValue,
      },
    });

    this.log.log(
      `Job ${jobId} applied: ${createdCategories} categories created.`,
    );
  }

  /**
   * Create the category nodes the sheet references but the catalogue lacks,
   * shallowest level first so each child's parent exists by the time it is
   * needed. Slugs follow the catalogue's own convention: bare name, prefixed
   * with the parent's slug on collision, numbered only as a last resort.
   */
  private async createMissingCategories(jobId: string): Promise<number> {
    const paths = await this.prisma.$queryRaw<
      { l1: string; l2: string; l3: string }[]
    >`
      SELECT DISTINCT l1, l2, l3 FROM "ProductImportRow"
      WHERE "jobId" = ${jobId} AND problem IS NULL AND "categoryId" IS NULL
      ORDER BY l1, l2, l3`;
    if (paths.length === 0) return 0;

    const taken = new Set(
      (await this.prisma.category.findMany({ select: { slug: true } })).map(
        (c) => c.slug,
      ),
    );
    const claim = (name: string, parentSlug: string | null): string => {
      let s = slugifyName(name);
      if (taken.has(s) && parentSlug) s = `${parentSlug}-${slugifyName(name)}`;
      const base = s;
      let n = 2;
      while (taken.has(s)) s = `${base}-${n++}`;
      taken.add(s);
      return s;
    };

    const index = await this.loadNameIndex();
    const slugById = new Map(
      (
        await this.prisma.category.findMany({ select: { id: true, slug: true } })
      ).map((c) => [c.id, c.slug]),
    );
    const nextOrder = new Map<string, number>();

    const ensure = async (
      parentId: string | null,
      name: string,
    ): Promise<string> => {
      const k = this.key(parentId, name);
      const found = index.get(k);
      if (found) return found;

      const orderKey = parentId ?? '';
      if (!nextOrder.has(orderKey)) {
        const agg = await this.prisma.category.aggregate({
          where: { parentId },
          _max: { sortOrder: true },
        });
        nextOrder.set(orderKey, (agg._max.sortOrder ?? -1) + 1);
      }
      const sortOrder = nextOrder.get(orderKey)!;
      nextOrder.set(orderKey, sortOrder + 1);

      const created = await this.prisma.category.create({
        data: {
          name,
          slug: claim(name, parentId ? (slugById.get(parentId) ?? null) : null),
          parentId,
          sortOrder,
          active: true,
        },
        select: { id: true, slug: true },
      });
      index.set(k, created.id);
      slugById.set(created.id, created.slug);
      return created.id;
    };

    const before = index.size;
    for (const p of paths) {
      const id1 = await ensure(null, p.l1);
      const id2 = await ensure(id1, p.l2);
      const leafId = await ensure(id2, p.l3);

      // Point this path's staged rows at the leaf that now exists. Scoped to
      // the one path, so it stays a small indexed update however big the sheet.
      await this.prisma.$executeRaw`
        UPDATE "ProductImportRow"
        SET "categoryId" = ${leafId}
        WHERE "jobId" = ${jobId} AND problem IS NULL AND "categoryId" IS NULL
          AND l1 = ${p.l1} AND l2 = ${p.l2} AND l3 = ${p.l3}`;
    }
    return index.size - before;
  }

  /** SKU → product id for the whole catalogue. */
  private async loadProductIndex(): Promise<Map<string, string>> {
    const rows = await this.prisma.product.findMany({
      select: { id: true, sku: true },
    });
    return new Map(rows.map((r) => [r.sku, r.id]));
  }

  /** (parentId, lowercased name) → category id, for the whole tree. */
  private async loadNameIndex(): Promise<Map<string, string>> {
    const cats = await this.prisma.category.findMany({
      select: { id: true, name: true, parentId: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const index = new Map<string, string>();
    for (const c of cats) {
      // First wins, matching the ORDER BY … LIMIT 1 in resolveRows.
      const k = this.key(c.parentId, c.name);
      if (!index.has(k)) index.set(k, c.id);
    }
    return index;
  }

  private key(parentId: string | null, name: string): string {
    return `${parentId ?? ''} ${name.toLowerCase()}`;
  }

  private async fail(jobId: string, err: unknown): Promise<void> {
    // Drop the staging rows too — a failed job is never resumed, and leaving
    // 130k rows behind per failure would grow the table without bound.
    await this.prisma.productImportRow
      .deleteMany({ where: { jobId } })
      .catch(() => undefined);
    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: ProductImportJobStatus.FAILED,
        phase: 'Failed',
        error: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
      },
    });
  }
}
