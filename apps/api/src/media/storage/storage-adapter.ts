/**
 * Pluggable storage adapter for MediaAsset uploads.
 *
 * Implementations (`LocalStorageAdapter`, future `S3StorageAdapter`, etc.)
 * are registered behind the `STORAGE_ADAPTER` provider token so the
 * `MediaService` doesn't need to know where files actually live.
 */
export interface SavedFile {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  save(input: UploadInput): Promise<SavedFile>;
  delete(filename: string): Promise<void>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
