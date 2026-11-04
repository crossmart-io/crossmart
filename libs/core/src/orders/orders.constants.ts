/** Serializes stores of one order, so a webhook and a poll never apply it twice. */
export const ORDER_LOCK_PREFIX = 'order:';

/** How often the worker reads each store's changed orders, the fallback for missed webhooks. */
export const ORDER_POLL_INTERVAL_MS = 2 * 60 * 1000;
/** Each poll reads a little before the last one ended, as channels index changes late. */
export const ORDER_POLL_OVERLAP_MS = 5 * 60 * 1000;
export const ORDER_POLL_SCHEDULER_ID = 'order-poll';

/** Jobs on the `orders` queue. */
export enum OrderJobName {
  /** Read every store's orders changed since its last poll. */
  PollAll = 'poll-orders',
  /** Read one order a webhook said changed. */
  FetchOne = 'fetch-order',
}

export const ORDER_JOB_ATTEMPTS = 5;
export const ORDER_JOB_BACKOFF_MS = 10_000;
export const ORDER_JOBS_KEPT_COMPLETED = 500;
export const ORDER_JOBS_KEPT_FAILED = 1000;

export const ORDER_PAGE_DEFAULT_LIMIT = 25;
export const ORDER_PAGE_MAX_LIMIT = 100;
export const ORDER_NOT_FOUND = 'Order not found';
