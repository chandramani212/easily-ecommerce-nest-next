export interface FetchedPayload {
  body: Buffer;
  contentType?: string;
}

export interface Fetcher {
  fetch(): Promise<FetchedPayload>;
}
