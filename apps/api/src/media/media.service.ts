import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MediaListQuery, UpdateMediaDto } from './dto/media.dto';
import { STORAGE_ADAPTER, StorageAdapter } from './storage/storage-adapter';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  // Some servers return image/jpg (non-standard) — accept both spellings.
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

const MAX_BYTES = 10 * 1024 * 1024;
// Remote imports often pull a high-res "large/original" variant that exceeds
// the user-upload cap. Use a separate, higher ceiling so the import doesn't
// silently skip product hero images.
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  /**
   * Fetches a remote image and stores it via the storage adapter, creating a
   * MediaAsset row. Used by the supplier-import runner when the import is
   * configured with `images.download = true`.
   *
   * Dedup + format-preference rules:
   *   - If a MediaAsset already exists for this `sourceUrl` AND it is webp,
   *     reuse it without re-downloading (fast path).
   *   - If an existing asset is non-webp, fetch the URL fresh (Accept prefers
   *     webp) and, if the new payload is webp, replace the on-disk file +
   *     update the row + rewrite product.images URLs that referenced the old
   *     URL. Otherwise discard the new payload and reuse the existing row.
   *   - If no existing asset, download and save with `sourceUrl` set.
   *
   * Per-image failures should be caught by the caller — the runner falls
   * back to the remote URL on failure so one bad image doesn't break a
   * whole import record.
   *
   * `headers` lets the caller supply auth headers when the remote image sits
   * behind credentials (e.g. ASI Central media URLs).
   */
  async downloadFromUrl(
    url: string,
    uploadedById?: string,
    headers?: Record<string, string>,
  ) {
    const existing = await this.prisma.mediaAsset.findUnique({
      where: { sourceUrl: url },
    });
    if (existing && existing.mimeType === 'image/webp') {
      return existing;
    }

    const res = await fetch(url, {
      // Strongly prefer webp so ASI (and similar content-negotiating servers)
      // return webp from the start. Falls back to other image types if webp
      // isn't available.
      headers: { Accept: 'image/webp,image/*;q=0.8', ...(headers ?? {}) },
    });
    if (!res.ok) {
      throw new BadRequestException(
        `Failed to fetch image ${url}: ${res.status} ${res.statusText}`,
      );
    }
    const rawMime = res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type from ${url}: ${mimeType || '<missing>'}`,
      );
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_DOWNLOAD_BYTES) {
      throw new BadRequestException(
        `Remote image too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB) at ${url}`,
      );
    }
    const originalName = filenameFromUrl(url, mimeType);

    // Upgrade path: existing non-webp → new webp. Replace file, update row,
    // and rewrite any Product.images that still pointed at the old URL so
    // there's no broken-image window.
    if (existing && mimeType === 'image/webp') {
      const saved = await this.storage.save({
        buffer,
        originalName,
        mimeType,
        size: buffer.length,
      });
      const oldUrl = existing.url;
      try {
        await this.storage.delete(existing.filename);
      } catch (err) {
        // Don't fail the whole upgrade if the old file is already gone.
        this.logger.warn(
          `Failed to remove old asset ${existing.filename}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      const updated = await this.prisma.mediaAsset.update({
        where: { id: existing.id },
        data: {
          filename: saved.filename,
          originalName,
          url: saved.url,
          mimeType: saved.mimeType,
          size: saved.size,
        },
      });
      await this.rewriteProductImageUrl(oldUrl, saved.url);
      return updated;
    }

    // Existing is non-webp AND new is also non-webp → reuse existing. We've
    // already paid the network cost but at least we don't pollute storage
    // with another copy.
    if (existing) {
      return existing;
    }

    const saved = await this.storage.save({
      buffer,
      originalName,
      mimeType,
      size: buffer.length,
    });
    return this.prisma.mediaAsset.create({
      data: {
        filename: saved.filename,
        originalName,
        url: saved.url,
        mimeType: saved.mimeType,
        size: saved.size,
        uploadedById: uploadedById ?? null,
        sourceUrl: url,
      },
    });
  }

  /**
   * Find every product whose `images` array still contains `oldUrl` and
   * rewrite that entry to `newUrl` in place. Used during the jpeg→webp
   * upgrade so existing products immediately reference the new file.
   */
  private async rewriteProductImageUrl(oldUrl: string, newUrl: string) {
    if (oldUrl === newUrl) return;
    const products = await this.prisma.product.findMany({
      where: { images: { has: oldUrl } },
      select: { id: true, images: true },
    });
    for (const p of products) {
      await this.prisma.product.update({
        where: { id: p.id },
        data: { images: p.images.map((u) => (u === oldUrl ? newUrl : u)) },
      });
    }
  }

  async upload(
    file: Express.Multer.File | undefined,
    uploadedById?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${[...ALLOWED_MIME].join(', ')}`,
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_BYTES / 1024 / 1024} MB.`,
      );
    }

    const saved = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return this.prisma.mediaAsset.create({
      data: {
        filename: saved.filename,
        originalName: file.originalname,
        url: saved.url,
        mimeType: saved.mimeType,
        size: saved.size,
        uploadedById: uploadedById ?? null,
      },
    });
  }

  async findAll(query: MediaListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '40', 10) || 40),
    );
    const where: Prisma.MediaAssetWhereInput = {};
    if (query.q) {
      where.OR = [
        { originalName: { contains: query.q, mode: 'insensitive' } },
        { filename: { contains: query.q, mode: 'insensitive' } },
        { alt: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async update(id: string, dto: UpdateMediaDto) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: { alt: dto.alt },
    });
  }

  async remove(id: string) {
    const asset = await this.findOne(id);
    await this.storage.delete(asset.filename);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Delete every MediaAsset whose `url` is not referenced by any
   * `Product.images` entry. Removes the on-disk file too. Used by the admin
   * "Cleanup orphans" button to reclaim space left over from duplicate
   * supplier-image downloads done before the sourceUrl dedup landed.
   *
   * Returns the number of assets actually deleted plus a small sample of
   * filenames for the UI to display.
   */
  async cleanupOrphans(): Promise<{
    deleted: number;
    fileFailures: number;
    sample: string[];
  }> {
    const orphans = await this.prisma.$queryRaw<
      { id: string; filename: string; url: string }[]
    >`
      SELECT "id", "filename", "url"
      FROM "MediaAsset"
      WHERE NOT EXISTS (
        SELECT 1 FROM "Product"
        WHERE "MediaAsset"."url" = ANY("Product"."images")
      )
    `;

    let deleted = 0;
    let fileFailures = 0;
    const sample: string[] = [];

    for (const o of orphans) {
      try {
        await this.storage.delete(o.filename);
      } catch (err) {
        // Don't block the row delete if the file was already gone — that's
        // the common case for old orphans where someone cleaned the upload
        // dir manually.
        fileFailures += 1;
        this.logger.warn(
          `Orphan cleanup: file delete failed for ${o.filename}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await this.prisma.mediaAsset.delete({ where: { id: o.id } });
      deleted += 1;
      if (sample.length < 10) sample.push(o.filename);
    }

    return { deleted, fileFailures, sample };
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

function filenameFromUrl(url: string, mimeType: string): string {
  try {
    const u = new URL(url);
    const tail = u.pathname.split('/').filter(Boolean).pop() ?? '';
    if (tail && /\.[a-z0-9]{1,6}$/i.test(tail)) return tail;
    if (tail) return `${tail}${MIME_TO_EXT[mimeType] ?? ''}`;
  } catch {
    /* fall through */
  }
  return `image${MIME_TO_EXT[mimeType] ?? ''}`;
}
