import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductImportJobStatus, TierPriceType } from '@prisma/client';
import { parse as csvParse } from 'csv-parse/sync';

import { PrismaService } from '../../prisma/prisma.service';
import { normalizeCell, slugifyName } from './bulk-columns';
import {
  type CategoryLookup,
  loadCategoryLookup,
  pathKey,
  primaryOf,
} from './category-paths';
import {
  mapProductHeaders,
  splitList,
  tierPriceCol,
  tierQtyCol,
} from './product-columns';

/** Rows validated (and staged) per batch; each batch loads its products once. */
const STAGE_BATCH = 2_000;
/** Rows written per apply transaction. */
const APPLY_BATCH = 1_000;
/** Cap on the problems listed in the report (counts are always exact). */
const REPORT_CAP = 200;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A cell holding just this empties an optional field (blank means "no
 * change", so emptying needs an explicit marker). Same word tier1Qty uses.
 */
const CLEAR = 'CLEAR';
const isClear = (v: string) => normalizeCell(v).toUpperCase() === CLEAR;
/** Optional text fields that CLEAR may empty. */
const CLEARABLE_TEXT = new Set([
  'shortDescription',
  'description',
  'metaTitle',
  'metaDescription',
  'keywords',
  'ogImage',
]);

interface Tier {
  minQuantity: number;
  type: TierPriceType;
  price: string;
}
interface Attribute {
  name: string;
  value: string;
}

/** Scalar columns an update may change. Values are always non-null. */
interface ScalarPatch {
  name?: string;
  slug?: string;
  active?: boolean;
  basePrice?: string;
  sellingPrice?: string;
  shortDescription?: string;
  description?: string;
  attributes?: Attribute[];
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImage?: string;
}
const SCALARS: (keyof ScalarPatch)[] = [
  'name',
  'slug',
  'active',
  'basePrice',
  'sellingPrice',
  'shortDescription',
  'description',
  'attributes',
  'metaTitle',
  'metaDescription',
  'keywords',
  'ogImage',
];
const TEXT_COLUMNS = [
  'name',
  'shortDescription',
  'description',
  'metaTitle',
  'metaDescription',
  'keywords',
  'ogImage',
] as const;

/** What a staged row will do when applied (stored in ProductImportRow.data). */
interface RowChange extends ScalarPatch {
  sku?: string; // create only
  tiers?: Tier[];
  addCategoryIds?: string[];
  removeCategoryIds?: string[];
  categoryIds?: string[]; // create only
  relatedIds?: string[];
}

interface Current {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  basePrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  shortDescription: string;
  description: string;
  attributes: Prisma.JsonValue;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string | null;
  tierPrices?: { minQuantity: number; type: TierPriceType; price: Prisma.Decimal }[];
  categories?: { id: string }[];
  relatedTo?: { id: string }[];
}

export interface ProductImportReport {
  problems: { row: number; sku: string; error: string }[];
  problemsTruncated: boolean;
  toCreate: number;
  toUpdate: number;
  /** Recognised columns, in file order. */
  columns: string[];
  /** Header cells that were not recognised and so were ignored. */
  ignoredColumns: string[];
  created?: number;
  updated?: number;
}

/** Row-level validation failure; the message ends up in the report. */
class RowError extends Error {}

const money = (v: Prisma.Decimal | string | number) => Number(v).toFixed(2);
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);
const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && sameList([...a].sort(), [...b].sort());

@Injectable()
export class ProductImportService {
  private readonly log = new Logger(ProductImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------- upload / confirm

  /**
   * Accept a full-product sheet and return a job id immediately; parsing and
   * validation run in the background. Nothing is written to the catalogue
   * until the job is applied.
   */
  async createJob(filename: string, csv: string, userId: string | null) {
    const { columns, ignored } = this.readHeader(csv);
    const job = await this.prisma.productImportJob.create({
      data: {
        filename,
        kind: 'PRODUCT',
        status: ProductImportJobStatus.PARSING,
        phase: 'Reading file',
        createdById: userId,
      },
      select: { id: true },
    });
    void this.runValidation(job.id, csv, columns, ignored).catch((err: unknown) => {
      this.log.error(`Validation failed for job ${job.id}`, err);
      return this.fail(job.id, err);
    });
    return { id: job.id };
  }

  async applyJob(id: string) {
    const job = await this.prisma.productImportJob.findUnique({
      where: { id },
      select: { status: true, kind: true },
    });
    if (!job || job.kind !== 'PRODUCT') {
      throw new NotFoundException('Import job not found');
    }
    if (job.status !== ProductImportJobStatus.VALIDATED) {
      throw new BadRequestException(
        `Job is ${job.status}; only a validated job can be applied.`,
      );
    }
    await this.prisma.productImportJob.update({
      where: { id },
      data: { status: ProductImportJobStatus.APPLYING, phase: 'Starting', processed: 0 },
    });
    void this.runApply(id).catch((err: unknown) => {
      this.log.error(`Apply failed for job ${id}`, err);
      return this.fail(id, err);
    });
    return { id };
  }

  // ------------------------------------------------------------- validation

  private readHeader(csv: string) {
    const nl = csv.indexOf('\n');
    const firstLine = (nl === -1 ? csv : csv.slice(0, nl)).replace(/^\uFEFF/, '');
    const cells = (csvParse(firstLine, { skip_empty_lines: true }) as string[][])[0];
    if (!cells?.length) throw new BadRequestException('The file has no header row.');

    const columns = mapProductHeaders(cells);
    if (!columns.includes('sku')) {
      throw new BadRequestException(
        'The file has no "sku" column. Download a sample to see the expected headers.',
      );
    }
    if (columns.filter(Boolean).length < 2) {
      throw new BadRequestException(
        `No product columns recognised besides sku. Found: ${cells.join(', ')}.`,
      );
    }
    const ignored = cells.filter((c, i) => c.trim() && columns[i] === null);
    return { columns, ignored };
  }

  private async runValidation(
    jobId: string,
    csv: string,
    columns: (string | null)[],
    ignored: string[],
  ) {
    const records = csvParse(csv.replace(/^\uFEFF/, ''), {
      skip_empty_lines: true,
      relax_column_count: true,
      from_line: 2,
    }) as string[][];

    const idx = new Map<string, number>();
    columns.forEach((c, i) => c && idx.set(c, i));
    const has = (c: string) => idx.has(c);
    const tierSlots = [...idx.keys()]
      .map((c) => /^tier(\d+)Qty$/.exec(c)?.[1])
      .filter((n): n is string => Boolean(n))
      .map(Number)
      .sort((a, b) => a - b);
    const hasCategories = ['categoryL1', 'categoryL2', 'categoryL3'].some(has);

    await this.progress(jobId, { total: records.length, phase: 'Loading catalogue', processed: 0 });

    // Whole-catalogue lookups, loaded once: SKU → id, and the owners of every
    // unique value a row might claim.
    const all = await this.prisma.product.findMany({
      select: { id: true, sku: true, slug: true },
    });
    const idBySku = new Map(all.map((p) => [p.sku, p.id]));
    const slugOwner = new Map(all.map((p) => [p.slug, p.id]));
    const lookup = hasCategories ? await loadCategoryLookup(this.prisma) : null;

    await this.progress(jobId, { phase: 'Checking rows' });

    const seenSku = new Set<string>();
    const problems: ProductImportReport['problems'] = [];
    let invalid = 0;
    let toCreate = 0;
    let toUpdate = 0;
    let unchanged = 0;

    for (let start = 0; start < records.length; start += STAGE_BATCH) {
      const slice = records.slice(start, start + STAGE_BATCH);
      const ids = slice
        .map((r) => idBySku.get(normalizeCell(r[idx.get('sku')!])))
        .filter((id): id is string => Boolean(id));
      const current = await this.loadCurrent(ids, {
        tiers: tierSlots.length > 0,
        categories: hasCategories,
        related: has('relatedSkus'),
        description: has('description'),
      });

      const rowNums: number[] = [];
      const skus: string[] = [];
      const productIds: (string | null)[] = [];
      const actions: (string | null)[] = [];
      const datas: (string | null)[] = [];
      const errs: (string | null)[] = [];

      slice.forEach((rec, i) => {
        const rowNum = start + i + 2; // 1-based, header is line 1
        const cell = (c: string) => (idx.has(c) ? (rec[idx.get(c)!] ?? '') : '');
        const sku = normalizeCell(cell('sku'));
        const productId = idBySku.get(sku) ?? null;
        let action: string | null = null;
        let data: RowChange | null = null;
        let problem: string | null = null;

        try {
          if (!sku) throw new RowError('Blank SKU');
          if (seenSku.has(sku.toLowerCase())) {
            throw new RowError('Duplicate SKU — only the first row is applied');
          }
          seenSku.add(sku.toLowerCase());

          const change = this.buildChange({
            cell,
            tierSlots,
            sku,
            current: productId ? current.get(productId) ?? null : null,
            productId,
            rowNum,
            idBySku,
            slugOwner,
            lookup,
          });
          if (!productId) {
            action = 'create';
            toCreate++;
          } else if (Object.keys(change).length === 0) {
            action = 'none';
            unchanged++;
          } else {
            action = 'update';
            toUpdate++;
          }
          data = change;
        } catch (err) {
          if (!(err instanceof RowError)) throw err;
          problem = err.message;
          invalid++;
          if (problems.length <= REPORT_CAP) problems.push({ row: rowNum, sku, error: problem });
        }

        rowNums.push(rowNum);
        skus.push(sku);
        productIds.push(productId);
        actions.push(action);
        datas.push(data ? JSON.stringify(data) : null);
        errs.push(problem);
      });

      await this.prisma.$executeRaw`
        INSERT INTO "ProductImportRow" (
          "jobId", "rowNum", sku, l1, l2, l3, "productId", problem, action, data
        )
        SELECT ${jobId}, r, s, '', '', '', pid, pr, a, d
        FROM unnest(
          ${rowNums}::int[], ${skus}::text[], ${productIds}::text[],
          ${errs}::text[], ${actions}::text[], ${datas}::jsonb[]
        ) AS u(r, s, pid, pr, a, d)`;

      await this.progress(jobId, { processed: Math.min(start + STAGE_BATCH, records.length) });
    }

    const report: ProductImportReport = {
      problems: problems.slice(0, REPORT_CAP),
      problemsTruncated: problems.length > REPORT_CAP,
      toCreate,
      toUpdate,
      columns: columns.filter((c): c is string => Boolean(c)),
      ignoredColumns: ignored,
    };
    await this.prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: ProductImportJobStatus.VALIDATED,
        phase: 'Ready to apply',
        processed: records.length,
        changed: toCreate + toUpdate,
        unchanged,
        invalid,
        report: report as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /** Current state of a batch of products — only the parts the sheet touches. */
  private async loadCurrent(
    ids: string[],
    include: { tiers: boolean; categories: boolean; related: boolean; description: boolean },
  ): Promise<Map<string, Current>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        basePrice: true,
        sellingPrice: true,
        shortDescription: true,
        // The widest column by far; skipped unless the sheet edits it.
        description: include.description,
        attributes: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogImage: true,
        tierPrices: include.tiers
          ? { select: { minQuantity: true, type: true, price: true } }
          : false,
        categories: include.categories ? { select: { id: true } } : false,
        relatedTo: include.related ? { select: { id: true } } : false,
      },
    });
    return new Map(rows.map((r) => [r.id, r as unknown as Current]));
  }

  /**
   * Validate one row and work out exactly what it changes. For an existing
   * product only differing fields are returned (empty object = no change); for
   * a new product the full create payload. Throws RowError on bad input.
   *
   * Blank cells never change anything — they mean "leave as is".
   */
  private buildChange(ctx: {
    cell: (c: string) => string;
    tierSlots: number[];
    sku: string;
    current: Current | null;
    productId: string | null;
    rowNum: number;
    idBySku: Map<string, string>;
    slugOwner: Map<string, string>;
    lookup: CategoryLookup | null;
  }): RowChange {
    const { cell, current, productId } = ctx;
    const creating = !productId;
    const owner = productId ?? `new:${ctx.rowNum}`;
    const change: RowChange = {};
    const errors: string[] = [];
    const attempt = (fn: () => void) => {
      try {
        fn();
      } catch (e) {
        if (e instanceof RowError) errors.push(e.message);
        else throw e;
      }
    };

    // ---- plain text
    for (const col of TEXT_COLUMNS) {
      attempt(() => {
        // Descriptions keep their line breaks; one-line fields are collapsed.
        const raw = cell(col);
        let v = col === 'description' ? raw.trim() : normalizeCell(raw);
        if (!v) return;
        if (isClear(v)) {
          if (!CLEARABLE_TEXT.has(col)) throw new RowError(`${col} cannot be cleared`);
          v = '';
        }
        if (col === 'shortDescription' && v.length > 500) {
          throw new RowError('shortDescription is longer than 500 characters');
        }
        // Compare the way the cell was read, so whitespace the catalogue
        // happens to carry (trailing spaces, double spaces) isn't a change.
        const curRaw = current ? (current[col] ?? '') : '';
        const cur = col === 'description' ? curRaw.trim() : normalizeCell(curRaw);
        if (creating || v !== cur) change[col] = v;
      });
    }

    // ---- slug
    attempt(() => {
      const v = normalizeCell(cell('slug')).toLowerCase();
      if (!v) return;
      if (!SLUG_RE.test(v)) throw new RowError(`Slug "${v}" may only contain a-z, 0-9 and single hyphens`);
      const o = ctx.slugOwner.get(v);
      if (o && o !== owner) throw new RowError(`Slug "${v}" is already used by another product`);
      ctx.slugOwner.set(v, owner);
      if (creating || v !== current?.slug) change.slug = v;
    });

    // ---- status
    attempt(() => {
      const v = normalizeCell(cell('active')).toLowerCase();
      if (!v) return;
      const on = ['true', 'yes', 'y', '1', 'active'].includes(v);
      const off = ['false', 'no', 'n', '0', 'inactive'].includes(v);
      if (!on && !off) throw new RowError(`active must be true or false, got "${v}"`);
      if (creating || on !== current?.active) change.active = on;
    });

    // ---- prices
    for (const col of ['basePrice', 'sellingPrice'] as const) {
      attempt(() => {
        const v = normalizeCell(cell(col));
        if (!v) return;
        const n = this.parseMoney(v, col);
        if (creating || n !== money(current![col])) change[col] = n;
      });
    }

    // ---- lists (images are not importable — managed in the product editor)
    attempt(() => {
      const v = cell('attributes');
      if (!v.trim()) return;
      const list = (isClear(v) ? [] : splitList(v)).map((pair) => {
        const eq = pair.indexOf('=');
        if (eq <= 0) throw new RowError(`attributes entry "${pair}" must look like Name=Value`);
        return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
      });
      const cur = Array.isArray(current?.attributes)
        ? (current!.attributes as unknown as Attribute[])
        : [];
      if (creating || JSON.stringify(list) !== JSON.stringify(cur.map((a) => ({ name: a.name, value: a.value })))) {
        change.attributes = list;
      }
    });

    // ---- quantity prices
    attempt(() => {
      const tiers = this.parseTiers(cell, ctx.tierSlots);
      if (tiers === undefined) return;
      const cur = (current?.tierPrices ?? [])
        .map((t) => ({ minQuantity: t.minQuantity, type: t.type, price: money(t.price) }))
        .sort((a, b) => a.minQuantity - b.minQuantity);
      if (creating || JSON.stringify(tiers) !== JSON.stringify(cur)) change.tiers = tiers;
    });

    // ---- categories
    if (ctx.lookup) {
      attempt(() => this.categoryChange(cell, ctx.lookup!, current, creating, change));
    }

    // ---- related products
    attempt(() => {
      const v = cell('relatedSkus');
      if (!v.trim()) return;
      const ids = (isClear(v) ? [] : splitList(v)).map((s) => {
        const id = ctx.idBySku.get(s);
        if (!id) throw new RowError(`Related SKU "${s}" does not exist`);
        if (id === productId) throw new RowError('A product cannot be related to itself');
        return id;
      });
      const unique = [...new Set(ids)];
      const cur = (current?.relatedTo ?? []).map((r) => r.id);
      if (creating || !sameSet(unique, cur)) change.relatedIds = unique;
    });

    if (errors.length) throw new RowError(errors.join('; '));

    if (creating) {
      if (!change.name) throw new RowError('New product: name is required');
      if (!change.sellingPrice) throw new RowError('New product: sellingPrice is required');
      change.basePrice ??= change.sellingPrice;
      if (!change.slug) {
        const base = slugifyName(change.name) || 'product';
        let slug = base;
        for (let n = 2; ctx.slugOwner.has(slug); n++) slug = `${base}-${n}`;
        ctx.slugOwner.set(slug, owner);
        change.slug = slug;
      }
      change.sku = ctx.sku;
    }
    return change;
  }

  private parseMoney(v: string, col: string): string {
    const n = Number(v.replace(/[$,\s]/g, ''));
    if (!Number.isFinite(n) || n < 0 || n >= 1e10) {
      throw new RowError(`${col} must be a number ≥ 0, got "${v}"`);
    }
    return n.toFixed(2);
  }

  /**
   * Tier columns → sorted tiers. undefined = all tier cells blank (no change);
   * [] = "CLEAR" in tier1Qty (remove every quantity price).
   */
  private parseTiers(cell: (c: string) => string, slots: number[]): Tier[] | undefined {
    if (slots.length === 0) return undefined;
    if (isClear(cell(tierQtyCol(1)))) return [];

    const tiers: Tier[] = [];
    for (const n of slots) {
      const q = normalizeCell(cell(tierQtyCol(n)));
      const p = normalizeCell(cell(tierPriceCol(n)));
      if (!q && !p) continue;
      if (!q || !p) throw new RowError(`tier${n}: both quantity and price are needed`);
      const qty = Number(q);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new RowError(`tier${n}Qty must be a whole number ≥ 1, got "${q}"`);
      }
      if (p.endsWith('%')) {
        const pct = Number(p.slice(0, -1));
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
          throw new RowError(`tier${n}Price percentage must be 0–100, got "${p}"`);
        }
        tiers.push({ minQuantity: qty, type: TierPriceType.PERCENTAGE, price: pct.toFixed(2) });
      } else {
        tiers.push({
          minQuantity: qty,
          type: TierPriceType.FIXED,
          price: this.parseMoney(p, `tier${n}Price`),
        });
      }
    }
    if (tiers.length === 0) return undefined;
    const qtys = tiers.map((t) => t.minQuantity);
    if (new Set(qtys).size !== qtys.length) throw new RowError('Two tiers have the same quantity');
    return tiers.sort((a, b) => a.minQuantity - b.minQuantity);
  }

  /**
   * categoryL1-L3 replace the product's PRIMARY category (its deepest link)
   * only. Any other links — merchandising buckets such as Best Sellers — are
   * kept as they are; those are managed from the category page.
   */
  private categoryChange(
    cell: (c: string) => string,
    lookup: CategoryLookup,
    current: Current | null,
    creating: boolean,
    change: RowChange,
  ) {
    const l1 = normalizeCell(cell('categoryL1'));
    const l2 = normalizeCell(cell('categoryL2'));
    const l3 = normalizeCell(cell('categoryL3'));
    if (!l1 && !l2 && !l3) return;
    if (!l1 || (l3 && !l2)) throw new RowError('Category path has a gap (fill L1, then L2, then L3)');
    const names = [l1, ...(l2 ? [l2] : []), ...(l3 ? l3.split(' > ').map((s) => s.trim()) : [])];
    const primaryId = lookup.byPath.get(pathKey(names));
    if (!primaryId) {
      throw new RowError(`Category "${names.join(' > ')}" does not exist — create it in Categories first`);
    }

    const cur = (current?.categories ?? []).map((c) => c.id);
    const curPrimary = primaryOf(cur, lookup)?.id;
    const next = [
      ...new Set([primaryId, ...cur.filter((id) => id !== curPrimary)]),
    ];
    if (creating) {
      change.categoryIds = next;
      return;
    }
    const add = next.filter((id) => !cur.includes(id));
    const remove = cur.filter((id) => !next.includes(id));
    if (add.length) change.addCategoryIds = add;
    if (remove.length) change.removeCategoryIds = remove;
  }

  // ------------------------------------------------------------------ apply

  private async runApply(jobId: string) {
    const job = await this.prisma.productImportJob.findUniqueOrThrow({
      where: { id: jobId },
      select: { total: true, report: true },
    });
    await this.progress(jobId, { phase: 'Writing products', processed: 0 });

    let created = 0;
    let updated = 0;
    let afterRow = 0;

    for (;;) {
      const rows = await this.prisma.productImportRow.findMany({
        where: {
          jobId,
          problem: null,
          action: { in: ['create', 'update'] },
          rowNum: { gt: afterRow },
        },
        orderBy: { rowNum: 'asc' },
        take: APPLY_BATCH,
        select: { rowNum: true, productId: true, action: true, data: true },
      });
      if (rows.length === 0) break;

      await this.prisma.$transaction(
        async (tx) => {
          for (const r of rows.filter((r) => r.action === 'create')) {
            await this.createProduct(tx, r.data as unknown as RowChange);
          }
          const updates = rows
            .filter((r) => r.action === 'update' && r.productId)
            .map((r) => ({ id: r.productId!, change: r.data as unknown as RowChange }));
          await this.applyUpdates(tx, updates);
        },
        { timeout: 300_000, maxWait: 30_000 },
      );

      created += rows.filter((r) => r.action === 'create').length;
      updated += rows.filter((r) => r.action === 'update').length;
      afterRow = rows[rows.length - 1]!.rowNum;
      await this.progress(jobId, { processed: Math.min(afterRow - 1, job.total) });
    }

    const report = {
      ...(job.report as unknown as ProductImportReport),
      created,
      updated,
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
    this.log.log(`Job ${jobId} applied: ${created} created, ${updated} updated.`);
  }

  private async createProduct(tx: Prisma.TransactionClient, c: RowChange) {
    await tx.product.create({
      data: {
        sku: c.sku!,
        name: c.name!,
        slug: c.slug!,
        active: c.active ?? true,
        basePrice: c.basePrice!,
        sellingPrice: c.sellingPrice!,
        shortDescription: c.shortDescription ?? '',
        description: c.description ?? '',
        attributes: (c.attributes ?? []) as unknown as Prisma.InputJsonValue,
        metaTitle: c.metaTitle ?? '',
        metaDescription: c.metaDescription ?? '',
        keywords: c.keywords ?? '',
        ogImage: c.ogImage,
        tierPrices: c.tiers?.length ? { create: c.tiers } : undefined,
        categories: c.categoryIds?.length
          ? { connect: c.categoryIds.map((id) => ({ id })) }
          : undefined,
        relatedTo: c.relatedIds?.length
          ? { connect: c.relatedIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  /** Set-based writes for a batch of updates: one statement per kind of change. */
  private async applyUpdates(
    tx: Prisma.TransactionClient,
    updates: { id: string; change: RowChange }[],
  ) {
    const scalar = updates
      .map(({ id, change }) => {
        const patch: Record<string, unknown> = {};
        for (const k of SCALARS) if (change[k] !== undefined) patch[k] = change[k];
        return Object.keys(patch).length ? { id, ...patch } : null;
      })
      .filter(Boolean);

    if (scalar.length) {
      // Fields a row doesn't change arrive as NULL and COALESCE keeps them.
      await tx.$executeRaw`
        UPDATE "Product" p SET
          name               = COALESCE(v.name, p.name),
          slug               = COALESCE(v.slug, p.slug),
          active             = COALESCE(v.active, p.active),
          "basePrice"        = COALESCE(v."basePrice", p."basePrice"),
          "sellingPrice"     = COALESCE(v."sellingPrice", p."sellingPrice"),
          "shortDescription" = COALESCE(v."shortDescription", p."shortDescription"),
          description        = COALESCE(v.description, p.description),
          attributes         = COALESCE(v.attributes, p.attributes),
          "metaTitle"        = COALESCE(v."metaTitle", p."metaTitle"),
          "metaDescription"  = COALESCE(v."metaDescription", p."metaDescription"),
          keywords           = COALESCE(v.keywords, p.keywords),
          "ogImage"          = COALESCE(v."ogImage", p."ogImage"),
          "updatedAt"        = now()
        FROM jsonb_to_recordset(${JSON.stringify(scalar)}::jsonb) AS v(
          id text, name text, slug text, active boolean,
          "basePrice" numeric, "sellingPrice" numeric, "shortDescription" text,
          description text, attributes jsonb, "metaTitle" text,
          "metaDescription" text, keywords text, "ogImage" text
        )
        WHERE p.id = v.id`;
    }

    const tiered = updates.filter((u) => u.change.tiers !== undefined);
    if (tiered.length) {
      await tx.tierPrice.deleteMany({ where: { productId: { in: tiered.map((u) => u.id) } } });
      await tx.tierPrice.createMany({
        data: tiered.flatMap((u) => u.change.tiers!.map((t) => ({ ...t, productId: u.id }))),
      });
    }

    const pairs = (key: 'addCategoryIds' | 'removeCategoryIds') => {
      const cats: string[] = [];
      const prods: string[] = [];
      for (const u of updates) {
        for (const c of u.change[key] ?? []) {
          cats.push(c);
          prods.push(u.id);
        }
      }
      return { cats, prods };
    };
    const rm = pairs('removeCategoryIds');
    if (rm.cats.length) {
      await tx.$executeRaw`
        DELETE FROM "_ProductCategories" pc
        USING unnest(${rm.cats}::text[], ${rm.prods}::text[]) AS x(a, b)
        WHERE pc."A" = x.a AND pc."B" = x.b`;
    }
    const add = pairs('addCategoryIds');
    if (add.cats.length) {
      await tx.$executeRaw`
        INSERT INTO "_ProductCategories" ("A", "B")
        SELECT * FROM unnest(${add.cats}::text[], ${add.prods}::text[])
        ON CONFLICT DO NOTHING`;
    }

    // Related products are rare; Prisma resolves the self-relation direction.
    for (const u of updates.filter((u) => u.change.relatedIds !== undefined)) {
      await tx.product.update({
        where: { id: u.id },
        data: { relatedTo: { set: u.change.relatedIds!.map((id) => ({ id })) } },
      });
    }
  }

  // ---------------------------------------------------------------- helpers

  private progress(
    jobId: string,
    data: { total?: number; processed?: number; phase?: string },
  ) {
    return this.prisma.productImportJob.update({ where: { id: jobId }, data });
  }

  private async fail(jobId: string, err: unknown) {
    await this.prisma.productImportRow.deleteMany({ where: { jobId } }).catch(() => undefined);
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
