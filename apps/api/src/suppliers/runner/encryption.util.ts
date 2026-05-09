import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AES-256-GCM cipher for at-rest secrets (supplier auth credentials).
 *
 * Storage format: `v1:<iv-base64>:<authTag-base64>:<ciphertext-base64>`
 *
 * Key sources, in order of precedence:
 *  1. `SECRETS_ENCRYPTION_KEY` (recommended) — base64 of exactly 32 bytes.
 *  2. Dev fallback: `JWT_SECRET` hashed with SHA-256.
 *
 * The dev fallback exists so local devs don't have to set a separate env;
 * production deployments should always set `SECRETS_ENCRYPTION_KEY` explicitly.
 */
@Injectable()
export class SecretsCipher {
  private readonly logger = new Logger(SecretsCipher.name);
  private readonly key: Buffer;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const explicit = config.get<string>('SECRETS_ENCRYPTION_KEY');
    if (explicit) {
      const buf = Buffer.from(explicit, 'base64');
      if (buf.length !== 32) {
        throw new Error(
          'SECRETS_ENCRYPTION_KEY must decode to exactly 32 bytes (base64).',
        );
      }
      this.key = buf;
    } else {
      const fallbackSeed =
        config.get<string>('JWT_SECRET') ?? 'easily-admin-dev-secret';
      this.key = createHash('sha256').update(fallbackSeed).digest();
      this.logger.warn(
        'SECRETS_ENCRYPTION_KEY not set; deriving from JWT_SECRET. Set explicitly for production.',
      );
    }
  }

  /** Encrypt an arbitrary JSON-serializable value. Returns the storage string. */
  encryptJson(value: unknown): string {
    const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [
      'v1',
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  /** Decrypt a storage string. Throws on tampering or bad version. */
  decryptJson<T = unknown>(blob: string): T {
    const parts = blob.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') {
      throw new Error('SecretsCipher: malformed ciphertext');
    }
    const [, ivB64, tagB64, ctB64] = parts as [string, string, string, string];
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8')) as T;
  }

  /** Best-effort decrypt; returns null instead of throwing. Useful for masking responses. */
  tryDecryptJson<T = unknown>(blob: string | null | undefined): T | null {
    if (!blob) return null;
    try {
      return this.decryptJson<T>(blob);
    } catch {
      return null;
    }
  }
}
