import { RETRY_AFTER_HEADER } from '../../sdk/http/http.constants.js';
import { MILLISECONDS_PER_SECOND } from '../../sdk/time/time.constants.js';
import { SHOPIFY_BACKOFF_BASE_MS, SHOPIFY_BACKOFF_MAX_MS } from '../shopify.constants.js';
import type { ShopifyQueryCost } from './shopify-graphql-response.js';

const EXPONENT_BASE = 2;

/** Exponential backoff for outages and network errors: 0.5 s, 1 s, 2 s... capped at 10 s. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(SHOPIFY_BACKOFF_BASE_MS * EXPONENT_BASE ** attempt, SHOPIFY_BACKOFF_MAX_MS);
}

/**
 * How long until the cost bucket holds enough points for the throttled query, from the
 * `throttleStatus` Shopify returns. Falls back to backoff when the cost is missing.
 */
export function throttleDelayMs(cost: ShopifyQueryCost | undefined, attempt: number): number {
  if (!cost || cost.throttleStatus.restoreRate <= 0) {
    return backoffDelayMs(attempt);
  }
  const shortfall = cost.requestedQueryCost - cost.throttleStatus.currentlyAvailable;
  const seconds = Math.max(shortfall, 0) / cost.throttleStatus.restoreRate;
  return Math.min(Math.ceil(seconds * MILLISECONDS_PER_SECOND), SHOPIFY_BACKOFF_MAX_MS);
}

/** The wait a 429 asks for (`Retry-After`, in seconds), or backoff when it gives none. */
export function retryAfterDelayMs(
  headers: Readonly<Record<string, string>>,
  attempt: number,
): number {
  const seconds = Number(headers[RETRY_AFTER_HEADER]);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds * MILLISECONDS_PER_SECOND, SHOPIFY_BACKOFF_MAX_MS)
    : backoffDelayMs(attempt);
}
