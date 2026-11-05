/** Where the hosted Crossmart API answers. Self-hosted installs pass their own `baseUrl`. */
export const DEFAULT_BASE_URL = 'https://api.crossmart.io';

/** Header that carries a workspace API key (`API_KEY_HEADER` in the backend). */
export const API_KEY_HEADER = 'x-api-key';
export const AUTHORIZATION_HEADER = 'authorization';
export const BEARER_PREFIX = 'Bearer ';
export const RETRY_AFTER_HEADER = 'retry-after';

/** HTTP methods that may be sent twice without changing the outcome (RFC 9110, section 9.2.2). */
export const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
  'PUT',
  'DELETE',
]);

export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_SERVER_ERROR_MIN = 500;
export const HTTP_SERVER_ERROR_MAX = 599;

export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_INITIAL_RETRY_DELAY_MS = 500;
export const DEFAULT_MAX_RETRY_DELAY_MS = 8_000;
/** A `Retry-After` longer than this is not waited for: the error is returned instead. */
export const MAX_RETRY_AFTER_MS = 60_000;
export const BACKOFF_MULTIPLIER = 2;
/** Each delay is randomised between (1 - jitter) and 100% of its value. */
export const BACKOFF_JITTER_RATIO = 0.25;
export const MS_PER_SECOND = 1_000;

/** Largest page the API serves. Iterators ask for it, so they make as few requests as possible. */
export const MAX_PAGE_SIZE = 100;

export const UNKNOWN_ERROR_MESSAGE = 'The Crossmart API returned an error';
export const VALIDATION_MESSAGE_SEPARATOR = '. ';
export const MISSING_CREDENTIALS_MESSAGE =
  'Pass an API key ({ apiKey }) or an OAuth access token ({ accessToken }) to new Crossmart().';
export const MISSING_WORKSPACE_MESSAGE =
  'No workspace id: pass { workspaceId } to the method or to new Crossmart(), ' +
  'or authenticate with an API key so the SDK can find its workspace.';
