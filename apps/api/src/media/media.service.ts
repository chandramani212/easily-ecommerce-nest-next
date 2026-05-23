import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MediaListQuery, UpdateMediaDto } from './dto/media.dto';
import { STORAGE_ADAPTER, StorageAdapter } from './storage/storage-adapter';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  /**
   * Fetches a remote image and stores it via the storage adapter, creating a
   * MediaAsset row. Used by the supplier-import runner when the import is
   * configured with `images.download = true`.
   *
   * Validates MIME and size with the same rules as user uploads. Returns the
   * saved MediaAsset. Caller is responsible for catching errors — typically
   * the runner falls back to the remote URL on failure so one bad image
   * doesn't break a whole import record.
   *
   * `headers` lets the caller supply auth headers when the remote image sits
   * behind credentials (e.g. ASI Central media URLs).
   */
  async downloadFromUrl(
    url: string,
    uploadedById?: string,
    headers?: Record<string, string>,
  ) {
    const res = await fetch(url, {
      headers: { Accept: 'image/*', ...(headers ?? {}) },
    });
    if (!res.ok) {
      throw new BadRequestException(
        `Failed to fetch image ${url}: ${res.status} ${res.statusText}`,
      );
    }
    const mimeType =
      res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type from ${url}: ${mimeType || '<missing>'}`,
      );
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException(
        `Remote image too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB) at ${url}`,
      );
    }
    const originalName = filenameFromUrl(url, mimeType);
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
      },
    });
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
