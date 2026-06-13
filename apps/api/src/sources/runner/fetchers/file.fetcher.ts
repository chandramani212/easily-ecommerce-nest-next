import { FetchedPayload, Fetcher } from './fetcher';

/**
 * In-memory fetcher that simply returns a buffer the caller already has —
 * used for FILE_FEED imports where the user uploads a sample / data file
 * via multipart, and for "test with sample" runs.
 */
export class FileFetcher implements Fetcher {
  constructor(
    private readonly body: Buffer,
    private readonly contentType?: string,
  ) {}

  async fetch(): Promise<FetchedPayload> {
    return { body: this.body, contentType: this.contentType };
  }
}
