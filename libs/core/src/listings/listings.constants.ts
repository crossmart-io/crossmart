import { ListingStatus } from '@crossmart/database';
import { SyncJobKind } from './enums/sync-job-kind.enum.js';
import { PriceRounding } from '../channels/enums/price-rounding.enum.js';

/** Separates the steps of a price explanation: "$89.00 → +15% → .99 = $102.99". */
export const PRICE_STEP_SEPARATOR = ' → ';
export const PRICE_RESULT_SEPARATOR = ' = ';
export const MANUAL_PRICE_LABEL = 'manual price';
export const BASE_PRICE_LABEL = 'base price';

/** The fraction a charm ending adds to a whole amount. */
export const ROUNDING_ENDINGS: Partial<Record<PriceRounding, string>> = {
  [PriceRounding.Ending99]: '0.99',
  [PriceRounding.Ending95]: '0.95',
};

/** How each rounding reads in an explanation. */
export const ROUNDING_LABELS: Record<PriceRounding, string> = {
  [PriceRounding.None]: 'no rounding',
  [PriceRounding.Ending99]: '.99',
  [PriceRounding.Ending95]: '.95',
  [PriceRounding.Whole]: 'whole',
};

/** Charm endings need cents; zero-decimal currencies (JPY) round to whole amounts instead. */
export const CHARM_ENDING_MIN_FRACTION_DIGITS = 2;

/** Products read per query when a whole selection is walked, such as to publish it. */
export const SELECTION_BATCH_SIZE = 500;
export const SELECTION_PREVIEW_DEFAULT_LIMIT = 25;
export const SELECTION_PREVIEW_MAX_LIMIT = 100;
export const CHANNEL_LISTINGS_DEFAULT_LIMIT = 25;
export const CHANNEL_LISTINGS_MAX_LIMIT = 100;

/**
 * How long a sync job waits for more changes to the same listing before it runs, so a burst
 * of edits (typing, bulk actions, an import) becomes one channel call. Stock waits least.
 */
export const SYNC_DEBOUNCE_MS: Record<SyncJobKind, number> = {
  [SyncJobKind.Inventory]: 2_000,
  [SyncJobKind.Price]: 5_000,
  [SyncJobKind.Content]: 10_000,
  [SyncJobKind.Delist]: 10_000,
  [SyncJobKind.ReconcileInventory]: 0,
  [SyncJobKind.SweepSyncRequests]: 0,
};
/** Retries for outages and rate limits, with exponential backoff from the base delay. */
export const SYNC_JOB_ATTEMPTS = 5;
export const SYNC_JOB_BACKOFF_MS = 30_000;
/** Finished jobs kept for inspection. */
export const SYNC_JOBS_KEPT_COMPLETED = 1_000;
export const SYNC_JOBS_KEPT_FAILED = 5_000;
/** ADR 0007: stock is reconciled every 15 minutes. */
export const INVENTORY_RECONCILIATION_INTERVAL_MS = 15 * 60 * 1000;
export const INVENTORY_RECONCILIATION_SCHEDULER_ID = 'inventory-reconciliation';
/**
 * A sync request older than this never ran: its job was lost (a dropped catalog event, a
 * flushed queue), since a job settles its request when it finishes or gives up, and its retries
 * are over within minutes. The sweep queues such listings again.
 */
export const SYNC_REQUEST_STALE_AFTER_MS = 60 * 60 * 1000;
export const SYNC_REQUEST_SWEEP_INTERVAL_MS = 15 * 60 * 1000;
export const SYNC_REQUEST_SWEEP_SCHEDULER_ID = 'sync-request-sweep';
/** Listings the sweep queues again per query and queue write. */
export const SYNC_REQUEST_SWEEP_BATCH_SIZE = 500;
/** Separates the parts of a job's coalescing key: `content:<connection>:<product>`. */
export const SYNC_JOB_KEY_SEPARATOR = ':';

/** Rough channel cost of each job, in rate-limit units, for the per-connection limiter. */
export const SYNC_JOB_COST: Record<SyncJobKind, number> = {
  [SyncJobKind.Inventory]: 10,
  [SyncJobKind.Price]: 10,
  [SyncJobKind.Content]: 30,
  [SyncJobKind.Delist]: 10,
  [SyncJobKind.ReconcileInventory]: 0,
  [SyncJobKind.SweepSyncRequests]: 0,
};

/** Why a listing's sync failed, when the error is not one written for merchants. */
export const UNEXPECTED_SYNC_FAILURE = 'The channel sync failed unexpectedly. It will be retried.';
export const CONNECTION_NOT_SYNCABLE = 'Connect this channel again before syncing it';
/** The `error` of a 409 body, as NestJS names the status. */
export const CONFLICT_ERROR = 'Conflict';
export const RETRY_NEEDS_CONNECTION = 'Connect this store again before publishing to it';
export const RETRY_NEEDS_SELECTION =
  'This product is not in this store. Add it to the store to publish it there.';
/** The listing statuses a retry puts back in the queue as pending. */
export const RETRYABLE_LISTING_STATUSES = [ListingStatus.ERROR, ListingStatus.DELISTED] as const;
export const LISTING_FAILURE_MAX_LENGTH = 500;

/** Products added to or removed from a store in one request. */
export const STORE_MEMBERSHIP_MAX_PRODUCTS = 250;
export const PRODUCT_NOT_FOUND_IN_WORKSPACE =
  'Some of these products do not exist in this workspace';

export const LISTING_NOT_FOUND = 'Listing not found';
export const LISTING_PRODUCT_NOT_FOUND = 'Product not found';

/**
 * Item specifics a merchant may set on one listing, and their sizes. eBay takes aspect names of
 * up to 40 characters, values of up to 50 (Inventory API) and up to 30 values per aspect.
 */
export const ITEM_SPECIFICS_MAX = 60;
export const ITEM_SPECIFIC_NAME_MAX_LENGTH = 40;
export const ITEM_SPECIFIC_VALUES_MAX = 30;
export const ITEM_SPECIFIC_VALUE_MAX_LENGTH = 50;
