/** Serializes stores of one order, so a webhook and a poll never apply it twice. */
export const ORDER_LOCK_PREFIX = 'order:';

/** How often the worker reads each store's changed orders, the fallback for missed webhooks. */
export const ORDER_POLL_INTERVAL_MS = 2 * 60 * 1000;
/** Each poll reads a little before the last one ended, as channels index changes late. */
export const ORDER_POLL_OVERLAP_MS = 5 * 60 * 1000;
export const ORDER_POLL_SCHEDULER_ID = 'order-poll';

/**
 * Finished orders (shipped or cancelled) are deleted this long after they were placed; open
 * orders stay, as they hold stock. Stated in the privacy policy, so change both together.
 */
export const ORDER_RETENTION_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;
export const ORDER_RETENTION_MS = ORDER_RETENTION_DAYS * DAY_MS;
export const ORDER_PURGE_INTERVAL_MS = DAY_MS;
export const ORDER_PURGE_SCHEDULER_ID = 'order-purge';
/** Orders deleted per statement, so a large purge never holds long locks. */
export const ORDER_PURGE_BATCH_SIZE = 500;

/** Jobs on the `orders` queue. */
export enum OrderJobName {
  /** Read every store's orders changed since its last poll. */
  PollAll = 'poll-orders',
  /** Read one order a webhook said changed. */
  FetchOne = 'fetch-order',
  /** Delete finished orders past the retention period. */
  PurgeOld = 'purge-orders',
}

export const ORDER_JOB_ATTEMPTS = 5;
export const ORDER_JOB_BACKOFF_MS = 10_000;
export const ORDER_JOBS_KEPT_COMPLETED = 500;
export const ORDER_JOBS_KEPT_FAILED = 1000;

export const ORDER_PAGE_DEFAULT_LIMIT = 25;
export const ORDER_PAGE_MAX_LIMIT = 100;
export const ORDER_NOT_FOUND = 'Order not found';
