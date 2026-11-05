/** Authenticate with a workspace API key, created in Settings → API keys. */
export interface ApiKeyCredentials {
  apiKey: string;
  accessToken?: never;
}

/** Authenticate with an OAuth access token issued to an AI agent or app (sent as a bearer token). */
export interface AccessTokenCredentials {
  accessToken: string;
  apiKey?: never;
}

export type CrossmartCredentials = ApiKeyCredentials | AccessTokenCredentials;

/** How failed requests are retried. Only idempotent methods (GET, PUT, DELETE…) are retried. */
export interface RetryOptions {
  /** Retries after the first attempt. 0 turns retries off. Default: 2. */
  maxRetries?: number;
  /** Delay before the first retry, doubled on each one. Default: 500 ms. */
  initialDelayMs?: number;
  /** Longest backoff delay. Default: 8000 ms. */
  maxDelayMs?: number;
}

export interface CrossmartOptions {
  /** The API's origin. Default: `https://api.crossmart.io`. Self-hosted: e.g. `http://localhost:3000`. */
  baseUrl?: string;
  /**
   * The workspace that methods act on when they are not given one. With an API key it can be
   * left out: a key belongs to exactly one workspace, and the SDK looks it up once.
   */
  workspaceId?: string;
  retry?: RetryOptions;
  /** A `fetch` implementation, for tests or runtimes without a global one. */
  fetch?: typeof globalThis.fetch;
}

/** Options every resource method accepts as its last argument. */
export interface RequestOptions {
  /** The workspace to act on, instead of the client's default. */
  workspaceId?: string;
  /** Cancels the request. */
  signal?: AbortSignal;
}
