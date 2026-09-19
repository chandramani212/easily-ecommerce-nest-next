import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';
import {
  type CategoryLookup,
  loadCategoryLookup,
  primaryOf,
} from '../products/bulk/category-paths';
import { absoluteUrl, buildFeedItem } from './feed-item';
import { AtomicFileWriter, el, w3cDate } from './xml';

export type SeoTargetName = 'sitemaps' | 'feed';
export const SEO_TARGETS: SeoTargetName[] = ['sitemaps', 'feed'];

/** Google allows 50,000 URLs per sitemap; stay comfortably under it. */
const URLS_PER_SITEMAP = 45_000;
const PRODUCT_BATCH = 5_000;
const FEED_BATCH = 2_000;
const CURRENCY = 'USD';
const FEED_FILE = 'google-merchant.xml';

/** SQL for "the storefront would show this product" (active and priced). */
const VISIBLE = Prisma.sql`p.active AND COALESCE(NULLIF(p."sellingPrice", 0), p."basePrice") > 0`;

/** Storefront routes for CMS pages (Page.slug → path). */
const PAGE_PATHS: Record<string, string> = {
  home: '/',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  returns: '/returns',
  shipping: '/shipping',
  'cookie-policy': '/cookie-policy',
  accessibility: '/accessibility',
};

/** Paths search engines shouldn't crawl (robots.txt). */
const DISALLOW = ['/cart', '/checkout', '/thank-you', '/search'];

const SITEMAP_HEAD =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
  ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
const SITEMAP_TAIL = '</urlset>\n';

interface GeneratedFile {
  key: string;
  path: string;
  items: number;
  bytes: number;
}

/**
 * XML sitemaps and the Google Merchant Center feed. Files are generated to
 * disk (nightly, or on demand from the admin) and served as static files by
 * SeoController — the storefront proxies /sitemap.xml, /sitemaps/*,
 * /feeds/* and /robots.txt to them.
 */
@Injectable()
export class SeoService implements OnModuleInit {
  private readonly log = new Logger(SeoService.name);
  private readonly outDir: string;
  private readonly running = new Set<SeoTargetName>();

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.outDir = config.get<string>(
      'SEO_OUTPUT_DIR',
      join(process.cwd(), 'generated', 'seo'),
    );
  }

  /** A run cut off by a restart would otherwise show "running" forever. */
  async onModuleInit() {
    await this.prisma.seoTarget.updateMany({
      where: { status: 'running' },
      data: { status: 'failed', error: 'Interrupted by a server restart', finishedAt: new Date() },
    });
  }

  @Cron('0 30 2 * * *')
  async nightly() {
    for (const t of SEO_TARGETS) {
      if (!this.running.has(t)) await this.run(t, 'schedule');
    }
  }

  // ------------------------------------------------------------ admin API

  async status() {
    const [settings, targets, files] = await Promise.all([
      this.siteSettings(),
      this.prisma.seoTarget.findMany(),
      this.prisma.seoFile.findMany({ orderBy: [{ target: 'asc' }, { sortOrder: 'asc' }] }),
    ]);
    return {
      siteUrl: settings.siteUrl,
      targets: SEO_TARGETS.map(
        (t) =>
          targets.find((x) => x.target === t) ?? {
            target: t,
            status: 'idle',
            trigger: 'manual',
            startedAt: null,
            finishedAt: null,
            durationMs: null,
            stats: {},
            error: null,
          },
      ),
      files,
    };
  }

  /** Start regenerating in the background; progress is read via status(). */
  async generate(target: SeoTargetName | 'all') {
    const targets = target === 'all' ? SEO_TARGETS : [target];
    if (targets.some((t) => this.running.has(t))) {
      throw new BadRequestException('A regeneration is already running.');
    }
    // Mark running before returning so the admin's first poll sees it.
    for (const t of targets) await this.markRunning(t, 'manual');
    void (async () => {
      for (const t of targets) await this.run(t, 'manual', true);
    })();
    return { started: targets };
  }

  /** How one product appears in the Google feed — or why it doesn't. */
  async feedPreview(sku: string) {
    const p = await this.prisma.product.findFirst({
      where: { sku: { equals: sku.trim(), mode: 'insensitive' } },
      select: {
        sku: true,
        name: true,
        slug: true,
        active: true,
        sellingPrice: true,
        basePrice: true,
        shortDescription: true,
        description: true,
        images: true,
        categories: { select: { id: true } },
      },
    });
    if (!p) throw new NotFoundException(`No product with SKU "${sku}"`);
    const [settings, lookup] = await Promise.all([
      this.siteSettings(),
      loadCategoryLookup(this.prisma),
    ]);
    const item = buildFeedItem(
      {
        ...p,
        sellingPrice: p.sellingPrice.toString(),
        basePrice: p.basePrice.toString(),
        categoryPath: primaryOf(p.categories.map((c) => c.id), lookup)?.names ?? [],
      },
      { siteUrl: settings.siteUrl, brand: settings.feedBrand, currency: CURRENCY },
    );
    return {
      sku: p.sku,
      name: p.name,
      productUrl: `${settings.siteUrl}/${p.slug}`,
      included: item.excluded.length === 0,
      excluded: item.excluded,
      fields: item.fields,
    };
  }

  // --------------------------------------------------------- public files

  /** Disk path for a public file, or null if it doesn't exist (yet). */
  async publicFile(kind: 'index' | 'sitemap' | 'feed', name = ''): Promise<string | null> {
    let path: string;
    if (kind === 'index') path = join(this.outDir, 'sitemap.xml');
    else if (kind === 'sitemap' && /^[a-z0-9-]+\.xml$/.test(name)) {
      path = join(this.outDir, 'sitemaps', name);
    } else if (kind === 'feed' && name === FEED_FILE) path = join(this.outDir, 'feeds', name);
    else return null;
    try {
      await fs.access(path);
      return path;
    } catch {
      return null;
    }
  }

  async robots(): Promise<string> {
    const { siteUrl } = await this.siteSettings();
    return [
      'User-agent: *',
      'Allow: /',
      ...DISALLOW.map((p) => `Disallow: ${p}`),
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n');
  }

  // ------------------------------------------------------------ runner

  private async markRunning(target: SeoTargetName, trigger: string) {
    this.running.add(target);
    await this.prisma.seoTarget.upsert({
      where: { target },
      create: { target, status: 'running', trigger, startedAt: new Date() },
      update: { status: 'running', trigger, startedAt: new Date(), error: null },
    });
  }

  private async run(target: SeoTargetName, trigger: string, alreadyMarked = false) {
    if (!alreadyMarked) await this.markRunning(target, trigger);
    const started = Date.now();
    try {
      const stats =
        target === 'sitemaps' ? await this.generateSitemaps() : await this.generateFeed();
      await this.prisma.seoTarget.update({
        where: { target },
        data: {
          status: 'idle',
          finishedAt: new Date(),
          durationMs: Date.now() - started,
          stats: stats as Prisma.InputJsonValue,
        },
      });
      this.log.log(`Regenerated ${target} in ${Date.now() - started} ms (${trigger}).`);
    } catch (err) {
      this.log.error(`Regenerating ${target} failed`, err);
      await this.prisma.seoTarget.update({
        where: { target },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          durationMs: Date.now() - started,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    } finally {
      this.running.delete(target);
    }
  }

  private async siteSettings() {
    const s = await this.prisma.settings.findUnique({ where: { id: 1 } });
    return {
      siteUrl: (s?.siteUrl || 'https://easilybranded.com').replace(/\/+$/, ''),
      feedBrand: s?.feedBrand || 'Easily Branded',
    };
  }

  /** Replace the SeoFile rows of one target in a single transaction. */
  private async recordFiles(target: SeoTargetName, files: GeneratedFile[]) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.seoFile.deleteMany({ where: { target } }),
      this.prisma.seoFile.createMany({
        data: files.map((f, i) => ({ ...f, target, generatedAt: now, sortOrder: i })),
      }),
    ]);
  }

  // ------------------------------------------------------------ sitemaps

  private async generateSitemaps() {
    const { siteUrl } = await this.siteSettings();
    const files: GeneratedFile[] = [];

    files.push(await this.writePagesSitemap(siteUrl));
    files.push(await this.writeCategoriesSitemap(siteUrl));
    const productFiles = await this.writeProductSitemaps(siteUrl);
    files.push(...productFiles);

    // Drop product sitemaps left over from a run that had more of them.
    const keep = new Set(files.map((f) => f.path.replace('/sitemaps/', '')));
    const dir = join(this.outDir, 'sitemaps');
    for (const name of await fs.readdir(dir)) {
      if (name.endsWith('.xml') && !keep.has(name)) await fs.rm(join(dir, name), { force: true });
    }

    const today = w3cDate(new Date());
    const index = await AtomicFileWriter.open(join(this.outDir, 'sitemap.xml'));
    await index.write(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        files
          .map((f) => `<sitemap>${el('loc', siteUrl + f.path)}${el('lastmod', today)}</sitemap>\n`)
          .join('') +
        '</sitemapindex>\n',
    );
    const indexBytes = await index.commit();

    const all: GeneratedFile[] = [
      { key: 'sitemap-index', path: '/sitemap.xml', items: files.length, bytes: indexBytes },
      ...files,
    ];
    await this.recordFiles('sitemaps', all);
    return {
      urls: files.reduce((n, f) => n + f.items, 0),
      files: all.length,
    };
  }

  private async writeSitemap(
    name: string,
    entries: AsyncIterable<string> | Iterable<string>,
  ): Promise<GeneratedFile> {
    const w = await AtomicFileWriter.open(join(this.outDir, 'sitemaps', `${name}.xml`));
    let items = 0;
    try {
      await w.write(SITEMAP_HEAD);
      for await (const e of entries) {
        await w.write(e);
        items++;
      }
      await w.write(SITEMAP_TAIL);
      const bytes = await w.commit();
      return { key: `sitemap-${name}`, path: `/sitemaps/${name}.xml`, items, bytes };
    } catch (err) {
      await w.abort();
      throw err;
    }
  }

  private url(loc: string, lastmod?: Date, image?: string): string {
    return (
      `<url>${el('loc', loc)}${lastmod ? el('lastmod', w3cDate(lastmod)) : ''}` +
      (image ? `<image:image>${el('image:loc', image)}</image:image>` : '') +
      '</url>\n'
    );
  }

  private async writePagesSitemap(siteUrl: string) {
    const pages = await this.prisma.page.findMany({ select: { slug: true, updatedAt: true } });
    const updated = new Map(pages.map((p) => [p.slug, p.updatedAt]));
    const entries = Object.entries(PAGE_PATHS).map(([slug, path]) =>
      this.url(siteUrl + (path === '/' ? '' : path), updated.get(slug)),
    );
    return this.writeSitemap('pages', entries);
  }

  /**
   * Categories a visitor can reach: active, every ancestor active, and holding
   * at least one visible product somewhere below — empty category pages are
   * thin content search engines penalise.
   */
  private async writeCategoriesSitemap(siteUrl: string) {
    const cats = await this.prisma.category.findMany({
      select: { id: true, slug: true, parentId: true, active: true, updatedAt: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const counts = await this.prisma.$queryRaw<{ id: string; n: bigint }[]>`
      SELECT pc."A" AS id, count(*) AS n
      FROM "_ProductCategories" pc JOIN "Product" p ON p.id = pc."B"
      WHERE ${VISIBLE}
      GROUP BY pc."A"`;
    const direct = new Map(counts.map((c) => [c.id, Number(c.n)]));
    const byId = new Map(cats.map((c) => [c.id, c]));

    // Roll product counts up to every ancestor.
    const total = new Map<string, number>();
    for (const c of cats) {
      const n = direct.get(c.id) ?? 0;
      if (!n) continue;
      const seen = new Set<string>();
      for (let node = byId.get(c.id); node && !seen.has(node.id); node = node.parentId ? byId.get(node.parentId) : undefined) {
        seen.add(node.id);
        total.set(node.id, (total.get(node.id) ?? 0) + n);
      }
    }
    const reachable = (id: string) => {
      const seen = new Set<string>();
      for (let node = byId.get(id); node; node = node.parentId ? byId.get(node.parentId) : undefined) {
        if (!node.active || seen.has(node.id)) return false;
        seen.add(node.id);
      }
      return true;
    };

    const entries = cats
      .filter((c) => (total.get(c.id) ?? 0) > 0 && reachable(c.id))
      .map((c) => this.url(`${siteUrl}/${c.slug}`, c.updatedAt));
    return this.writeSitemap('categories', entries);
  }

  private async writeProductSitemaps(siteUrl: string): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    let cursor = '';
    let done = false;

    for (let n = 1; !done; n++) {
      const prisma = this.prisma;
      const url = this.url.bind(this);
      // One sitemap's worth of products, fetched in keyset batches.
      const entries = async function* () {
        let written = 0;
        while (written < URLS_PER_SITEMAP) {
          const take = Math.min(PRODUCT_BATCH, URLS_PER_SITEMAP - written);
          const rows = await prisma.$queryRaw<
            { id: string; slug: string; updatedAt: Date; image: string | null }[]
          >`
            SELECT p.id, p.slug, p."updatedAt", p.images[1] AS image
            FROM "Product" p
            WHERE ${VISIBLE} AND p.id > ${cursor}
            ORDER BY p.id
            LIMIT ${take}`;
          for (const r of rows) {
            yield url(
              `${siteUrl}/${r.slug}`,
              r.updatedAt,
              r.image ? absoluteUrl(siteUrl, r.image) : undefined,
            );
          }
          written += rows.length;
          if (rows.length) cursor = rows[rows.length - 1]!.id;
          if (rows.length < take) {
            done = true;
            return;
          }
        }
      };
      const file = await this.writeSitemap(`products-${n}`, entries());
      if (file.items > 0 || n === 1) files.push(file);
    }
    return files;
  }

  // ---------------------------------------------------------------- feed

  private async generateFeed() {
    const { siteUrl, feedBrand } = await this.siteSettings();
    const lookup: CategoryLookup = await loadCategoryLookup(this.prisma);
    const ctx = { siteUrl, brand: feedBrand, currency: CURRENCY };

    const w = await AtomicFileWriter.open(join(this.outDir, 'feeds', FEED_FILE));
    let included = 0;
    const excluded: Record<string, number> = {};

    try {
      await w.write(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n' +
          el('title', feedBrand) +
          el('link', siteUrl) +
          el('description', `${feedBrand} product feed`) +
          '\n',
      );

      let cursor = '';
      for (;;) {
        const rows = await this.prisma.$queryRaw<
          {
            id: string;
            sku: string;
            name: string;
            slug: string;
            active: boolean;
            sellingPrice: Prisma.Decimal;
            basePrice: Prisma.Decimal;
            shortDescription: string;
            description: string;
            images: string[] | null;
            cats: string[] | null;
          }[]
        >`
          SELECT p.id, p.sku, p.name, p.slug, p.active, p."sellingPrice",
                 p."basePrice", p."shortDescription", p.description, p.images,
                 (SELECT array_agg(pc."A") FROM "_ProductCategories" pc WHERE pc."B" = p.id) AS cats
          FROM "Product" p
          WHERE p.id > ${cursor}
          ORDER BY p.id
          LIMIT ${FEED_BATCH}`;
        if (rows.length === 0) break;

        let chunk = '';
        for (const r of rows) {
          const item = buildFeedItem(
            {
              ...r,
              sellingPrice: r.sellingPrice.toString(),
              basePrice: r.basePrice.toString(),
              categoryPath: primaryOf(r.cats ?? [], lookup)?.names ?? [],
            },
            ctx,
          );
          if (item.excluded.length) {
            const reason = item.excluded[0]!;
            excluded[reason] = (excluded[reason] ?? 0) + 1;
          } else {
            chunk += item.xml;
            included++;
          }
        }
        await w.write(chunk);
        cursor = rows[rows.length - 1]!.id;
        if (rows.length < FEED_BATCH) break;
      }

      await w.write('</channel>\n</rss>\n');
      const bytes = await w.commit();
      await this.recordFiles('feed', [
        { key: 'google-merchant', path: `/feeds/${FEED_FILE}`, items: included, bytes },
      ]);
    } catch (err) {
      await w.abort();
      throw err;
    }
    return { included, excluded };
  }
}

