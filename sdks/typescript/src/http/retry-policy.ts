import {
  BACKOFF_JITTER_RATIO,
  BACKOFF_MULTIPLIER,
  DEFAULT_INITIAL_RETRY_DELAY_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_MAX_RETRY_DELAY_MS,
  HTTP_SERVER_ERROR_MAX,
  HTTP_SERVER_ERROR_MIN,
  HTTP_TOO_MANY_REQUESTS,
  IDEMPOTENT_METHODS,
  MAX_RETRY_AFTER_MS,
  MS_PER_SECOND,
  RETRY_AFTER_HEADER,
} from '../crossmart.constants.js';
import type { RetryOptions } from '../options.js';

/** Decides whether and when a request is sent again. Pure, so it is easy to test. */
export class RetryPolicy {
  readonly maxRetries: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(
    options: RetryOptions = {},
    private readonly random: () => number = Math.random,
  ) {
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_RETRY_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  }

  /** Only idempotent methods are retried: a repeated POST could create a product twice. */
  canRetry(method: string): boolean {
    return this.maxRetries > 0 && IDEMPOTENT_METHODS.has(method.toUpperCase());
  }

  isRetryableStatus(status: number): boolean {
    return (
      status === HTTP_TOO_MANY_REQUESTS ||
      (status >= HTTP_SERVER_ERROR_MIN && status <= HTTP_SERVER_ERROR_MAX)
    );
  }

  /**
   * How long to wait before retry number `attempt` (0-based) after `response`, or `null` when
   * the server asks for a longer wait than `MAX_RETRY_AFTER_MS`.
   */
  delayAfterResponse(response: Response, attempt: number, now: number = Date.now()): number | null {
    const retryAfterMs = parseRetryAfter(response.headers.get(RETRY_AFTER_HEADER), now);
    if (retryAfterMs === undefined) {
      return this.backoffDelay(attempt);
    }
    return retryAfterMs > MAX_RETRY_AFTER_MS ? null : retryAfterMs;
  }

  /** Exponential backoff with jitter, capped at `maxDelayMs`. */
  backoffDelay(attempt: number): number {
    const exponential = this.initialDelayMs * BACKOFF_MULTIPLIER ** attempt;
    const capped = Math.min(exponential, this.maxDelayMs);
    return Math.round(capped * (1 - BACKOFF_JITTER_RATIO * this.random()));
  }
}

/**
 * `Retry-After` in milliseconds: either delay-seconds or an HTTP date (RFC 9110, section 10.2.3).
 * `undefined` when the header is absent or unreadable.
 */
export function parseRetryAfter(
  value: string | null,
  now: number = Date.now(),
): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * MS_PER_SECOND);
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}
