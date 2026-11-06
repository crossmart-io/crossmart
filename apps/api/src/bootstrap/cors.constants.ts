import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, API_KEY_HEADER } from '@crossmart/common';
import { ASK_ROUTE } from '../ask/ask.constants.js';
import { AUTHORIZATION_HEADER } from '../auth/auth.constants.js';

/** Where URI-versioned routes start: `/api/v1`. */
const VERSIONED_API_PATH = `/${API_GLOBAL_PREFIX}/v${API_DEFAULT_VERSION}`;

/**
 * Routes any website may call from a browser: public, rate-limited and without cookies, such as
 * Ask Crossmart (ADR 0022). Every other route allows only the trusted origins in `CORS_ORIGINS`.
 */
export const PUBLIC_CORS_PATHS: ReadonlySet<string> = new Set([
  `${VERSIONED_API_PATH}/${ASK_ROUTE}`,
]);

export const ANY_ORIGIN = '*';
export const PUBLIC_CORS_METHODS = ['POST', 'OPTIONS'];
export const CONTENT_TYPE_HEADER = 'content-type';
export const RETRY_AFTER_HEADER = 'retry-after';
export const ORIGIN_HEADER = 'origin';
/** How long a browser may reuse a preflight answer for a public route, in seconds. */
export const PUBLIC_CORS_MAX_AGE_SECONDS = 10 * 60;

/**
 * The CORS policy of `PUBLIC_CORS_PATHS`: any origin, no credentials (so a browser neither sends
 * cookies nor exposes the answer to a page that did), `POST` only, and the headers a widget or a
 * keyed caller sends. `Retry-After` is readable, so a widget can say when to try again.
 */
export const PUBLIC_CORS_OPTIONS: CorsOptions = {
  origin: ANY_ORIGIN,
  credentials: false,
  methods: PUBLIC_CORS_METHODS,
  allowedHeaders: [CONTENT_TYPE_HEADER, API_KEY_HEADER, AUTHORIZATION_HEADER],
  exposedHeaders: [RETRY_AFTER_HEADER],
  maxAge: PUBLIC_CORS_MAX_AGE_SECONDS,
};
