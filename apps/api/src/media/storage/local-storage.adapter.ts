import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import {
  SavedFile,
  StorageAdapter,
  UploadInput,
} from './storage-adapter';

const SAFE_EXT = /\.[a-z0-9]{1,6}$/i;

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Saves files under `apps/api/uploads/` and serves them at
 * `${PUBLIC_API_URL}/uploads/<filename>`.
 *
 * Designed so it can be swapped with an S3/R2 adapter without touching
 * `MediaService` consumers.
 */
@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.uploadDir = config.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
    const publicUrl = (
      config.get<string>('PUBLIC_API_URL') ??
      `http://localhost:${config.get<string>('PORT', '3001')}`
    ).replace(/\/$/, '');
    this.publicBaseUrl = `${publicUrl}/uploads`;
  }

  async save(input: UploadInput): Promise<SavedFile> {
    await mkdir(this.uploadDir, { recursive: true });

    const extMatch = input.originalName.match(SAFE_EXT);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';
    const base = sanitize(input.originalName) || 'file';
    const random = randomBytes(4).toString('hex');
    const filename = `${Date.now()}-${random}-${base}${ext || extname(input.originalName) || ''}`;

    const fullPath = join(this.uploadDir, filename);
    await writeFile(fullPath, input.buffer);

    return {
      filename,
      url: `${this.publicBaseUrl}/${filename}`,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async delete(filename: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, filename));
    } catch (err) {
      this.logger.warn(`Failed to delete ${filename}: ${(err as Error).message}`);
    }
  }
}
