import { createWriteStream, promises as fs } from 'node:fs';
import { dirname } from 'node:path';

/** Escape text for an XML element or attribute. Drops XML-illegal control chars. */
export function xmlEscape(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** `<tag>escaped</tag>`, or '' when the value is empty. */
export function el(tag: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `<${tag}>${xmlEscape(String(value))}</${tag}>`;
}

/** W3C date (YYYY-MM-DD) for <lastmod>. */
export const w3cDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Streams a file to `<path>.tmp` and renames it into place on close, so a
 * request never sees a half-written sitemap and a failed run leaves the
 * previous file untouched. Tracks bytes written.
 */
export class AtomicFileWriter {
  private readonly stream;
  private readonly tmp: string;
  bytes = 0;

  private constructor(private readonly path: string) {
    this.tmp = `${path}.tmp`;
    this.stream = createWriteStream(this.tmp, { encoding: 'utf8' });
  }

  static async open(path: string): Promise<AtomicFileWriter> {
    await fs.mkdir(dirname(path), { recursive: true });
    return new AtomicFileWriter(path);
  }

  write(chunk: string): Promise<void> {
    this.bytes += Buffer.byteLength(chunk, 'utf8');
    return new Promise((resolve, reject) => {
      const ok = this.stream.write(chunk, (err) => err && reject(err));
      if (ok) resolve();
      else this.stream.once('drain', resolve);
    });
  }

  async commit(): Promise<number> {
    await new Promise<void>((resolve, reject) =>
      this.stream.end((err?: Error | null) => (err ? reject(err) : resolve())),
    );
    await fs.rename(this.tmp, this.path);
    return this.bytes;
  }

  async abort(): Promise<void> {
    this.stream.destroy();
    await fs.rm(this.tmp, { force: true });
  }
}
