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
