import type { HttpMethod } from './http-method.enum.js';

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers?: Readonly<Record<string, string>>;
  body?: string;
  /** A binary body (a multipart upload), sent instead of `body`. */
  bytes?: Uint8Array<ArrayBuffer>;
}

export interface HttpResponse {
  status: number;
  /** Header names are lower case. */
  headers: Readonly<Record<string, string>>;
  body: string;
}

/**
 * How connectors reach channel APIs. Connectors never call `fetch` directly, so tests replay
 * recorded fixtures through `FakeHttpTransport` and no test talks to a real channel.
 */
export abstract class HttpTransport {
  /** Resolves with any HTTP status; rejects only when no response arrived (network, timeout). */
  abstract send(request: HttpRequest): Promise<HttpResponse>;
}
