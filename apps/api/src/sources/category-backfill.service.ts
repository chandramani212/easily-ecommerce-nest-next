import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { buildAuthAdapter } from './runner/auth';
import { SecretsCipher } from './runner/encryption.util';
import { AsiCentralFetcher } from './runner/fetchers/asi-central.fetcher';
import { matchProductIds } from './category-map/category-map.util';

export interface BackfillStatus {
  running: boolean;
  total: number;
  processed: number;
  productsConnected: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

const idle = (): BackfillStatus => ({
  running: false,
  total: 0,
  processed: 0,
  productsConnected: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
});

const CONNECT_CHUNK = 500;
const norm = (s: string | null | undefined): string =>
  (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Backfills product → curated-category links for existing products by asking
 * ASI search which products belong to each mapped (leaf) category, then
 * attaching the curated category. Runs as an in-process background job with
 * in-memory progress; resumable (skips categories already populated).
 */
@Injectable()
export class CategoryBackfillService {
  private readonly logger = new Logger(CategoryBackfillService.name);
  private readonly status = new Map<string, BackfillStatus>();
  /** Progress for the local (no-ASI) curated re-sync job, keyed by source. */
  private readonly resyncStatus = new Map<string, BackfillStatus>();
  /** ASI tree node name (normalized) → exact ContextPath, for the 388 facet cats. */
  private readonly nameToCtx = this.loadTree();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretsCipher,
  ) {}

  private loadTree(): Map<string, string> {
    try {
      const tree = JSON.parse(
        readFileSync(join(__dirname, 'category-map', 'asi-category-tree.json'), 'utf8'),
      ) as { name: string; ctx: string }[];
      return new Map(tree.map((n) => [norm(n.name), n.ctx]));
    } catch {
      return new Map();
    }
  }

  getStatus(sourceId: string): BackfillStatus {
    return this.status.get(sourceId) ?? idle();
  }

  /** Start the backfill for a source (no-op if one is already running). */
  start(sourceId: string): BackfillStatus {
    const current = this.status.get(sourceId);
    if (current?.running) return current;
    const fresh: BackfillStatus = {
      ...idle(),
      running: true,
      startedAt: new Date().toISOString(),
    };
    this.status.set(sourceId, fresh);
    // Fire and forget; progress is polled via getStatus.
    void this.run(sourceId).catch((e) => {
      const s = this.status.get(sourceId);
      if (s) {
        s.running = false;
        s.finishedAt = new Date().toISOString();
        s.error = e instanceof Error ? e.message : String(e);
      }
      this.logger.error(`Backfill failed for source ${sourceId}: ${String(e)}`);
    });
    return fresh;
  }

  private tokenFor(
    name: string,
    parentName: string | null,
  ): string | null {
    // Exact ContextPath when the (child or top) category is in the ASI facet tree.
    if (parentName) {
      const exact = this.nameToCtx.get(norm(parentName) + norm(name));
      if (exact) return exact;
    }
    const top = this.nameToCtx.get(norm(name));
    if (top) return top;
    // Long-tail fallback: ASI accepts the UPPERCASE name as the token.
    if (!parentName) return name.toUpperCase();
    return null; // niche child not in the tree — skip (best-effort)
  }

  private async run(sourceId: string): Promise<void> {
    const status = this.status.get(sourceId)!;
    const source = await this.prisma.source.findUnique({ where: { id: sourceId } });
    if (!source || source.kind !== 'ASI_CENTRAL') {
      throw new Error('Source not found or not an ASI source.');
    }

    const creds = source.authSecret ? this.cipher.tryDecryptJson(source.authSecret) : null;
    const auth = buildAuthAdapter(source.authType, creds ?? {});
    const fetcher = new AsiCentralFetcher(
      { baseUrl: source.baseUrl, maxSearchWalks: 1 },
      auth,
    );

    // ASI product id → local product id.
    const links = await this.prisma.sourceProductLink.findMany({
      where: { sourceId },
      select: { externalId: true, productId: true },
    });
    const productIdByAsiId = new Map(links.map((l) => [l.externalId, l.productId]));

    // Leaf curated categories (products render only on leaves).
    const leafRows = await this.prisma.category.findMany({
      where: { children: { none: {} } },
      select: { id: true, products: { select: { id: true }, take: 1 } },
    });
    const leafIds = new Set(leafRows.map((c) => c.id));
    const populated = new Set(leafRows.filter((c) => c.products.length > 0).map((c) => c.id));

    // Mapped source categories that point at a leaf curated category.
    const rows = await this.prisma.sourceCategory.findMany({
      where: { sourceId, categoryId: { not: null } },
      select: { id: true, externalId: true, name: true, parentExternalId: true, categoryId: true },
    });
    const byId = new Map(rows.map((r) => [r.externalId, r]));
    const targets = rows.filter((r) => r.categoryId && leafIds.has(r.categoryId));

    status.total = targets.length;

    for (const r of targets) {
      if (!status.running) break; // (defensive)
      const categoryId = r.categoryId!;
      if (populated.has(categoryId)) {
        status.processed += 1;
        continue; // resume: already backfilled
      }
      const parentName = r.parentExternalId
        ? byId.get(r.parentExternalId)?.name ?? null
        : null;
      const token = this.tokenFor(r.name, parentName);
      if (token) {
        try {
          const asiIds = await fetcher.collectCategoryProductIds(token);
          const productIds = matchProductIds(asiIds, productIdByAsiId);
          for (let i = 0; i < productIds.length; i += CONNECT_CHUNK) {
            const chunk = productIds.slice(i, i + CONNECT_CHUNK).map((id) => ({ id }));
            // Store the durable product↔source-category link…
            await this.prisma.sourceCategory.update({
              where: { id: r.id },
              data: { products: { connect: chunk } },
            });
            // …and attach the curated category now (skips a later resync).
            await this.prisma.category.update({
              where: { id: categoryId },
              data: { products: { connect: chunk } },
            });
          }
          status.productsConnected += productIds.length;
          if (productIds.length > 0) populated.add(categoryId);
        } catch (e) {
          this.logger.warn(`Backfill ${r.name} (${token}) failed: ${String(e)}`);
        }
      }
      status.processed += 1;
    }

    status.running = false;
    status.finishedAt = new Date().toISOString();
    this.logger.log(
      `Backfill done for ${sourceId}: ${status.processed}/${status.total} categories, ` +
        `${status.productsConnected} product links.`,
    );
  }

  // --- Local re-sync (no ASI) ------------------------------------------------

  getResyncStatus(sourceId: string): BackfillStatus {
    return this.resyncStatus.get(sourceId) ?? idle();
  }

  /**
   * Re-derive every product's curated categories from its stored
   * product↔source-category links + the current source→curated mapping.
   * Pure DB — no ASI. Use after changing the mapping. Only affects products
   * that already have source-category links (i.e. imported or ASI-backfilled).
   */
  startResync(sourceId: string): BackfillStatus {
    const current = this.resyncStatus.get(sourceId);
    if (current?.running) return current;
    const fresh: BackfillStatus = { ...idle(), running: true, startedAt: new Date().toISOString() };
    this.resyncStatus.set(sourceId, fresh);
    void this.runResync(sourceId).catch((e) => {
      const s = this.resyncStatus.get(sourceId);
      if (s) {
        s.running = false;
        s.finishedAt = new Date().toISOString();
        s.error = e instanceof Error ? e.message : String(e);
      }
      this.logger.error(`Resync failed for source ${sourceId}: ${String(e)}`);
    });
    return fresh;
  }

  private async runResync(sourceId: string): Promise<void> {
    const status = this.resyncStatus.get(sourceId)!;
    const PAGE = 500;

    const total = await this.prisma.product.count({
      where: { sourceCategories: { some: { sourceId } } },
    });
    status.total = total;

    let cursor: string | undefined;
    for (;;) {
      const page = await this.prisma.product.findMany({
        where: { sourceCategories: { some: { sourceId } } },
        select: {
          id: true,
          sourceCategories: { where: { sourceId }, select: { categoryId: true } },
        },
        orderBy: { id: 'asc' },
        take: PAGE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (page.length === 0) break;

      for (const prod of page) {
        const catIds = [
          ...new Set(
            prod.sourceCategories
              .map((sc) => sc.categoryId)
              .filter((v): v is string => !!v),
          ),
        ];
        await this.prisma.product.update({
          where: { id: prod.id },
          data: { categories: { set: catIds.map((id) => ({ id })) } },
        });
        status.processed += 1;
        status.productsConnected += catIds.length > 0 ? 1 : 0;
      }
      cursor = page[page.length - 1].id;
      if (page.length < PAGE) break;
    }

    status.running = false;
    status.finishedAt = new Date().toISOString();
    this.logger.log(
      `Resync done for ${sourceId}: ${status.processed} products re-categorized locally.`,
    );
  }
}
