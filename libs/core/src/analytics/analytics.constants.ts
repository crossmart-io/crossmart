import { SalesInterval } from './enums/sales-interval.enum.js';
import { SalesRange } from './enums/sales-range.enum.js';

export interface SalesRangeSpec {
  interval: SalesInterval;
  /** Buckets in the period, the current (partial) one included. */
  buckets: number;
}

/** Each range's bucket size and count. Weeks start on Monday, as Postgres `date_trunc` does. */
export const SALES_RANGE_SPECS: Record<SalesRange, SalesRangeSpec> = {
  [SalesRange.Last7Days]: { interval: SalesInterval.Day, buckets: 7 },
  [SalesRange.Last30Days]: { interval: SalesInterval.Day, buckets: 30 },
  [SalesRange.Last90Days]: { interval: SalesInterval.Week, buckets: 13 },
  [SalesRange.Last12Months]: { interval: SalesInterval.Month, buckets: 12 },
};

/** The Postgres interval one bucket of each size spans. */
export const SALES_INTERVAL_STEPS: Record<SalesInterval, string> = {
  [SalesInterval.Day]: '1 day',
  [SalesInterval.Week]: '1 week',
  [SalesInterval.Month]: '1 month',
};

export const DEFAULT_SALES_RANGE = SalesRange.Last30Days;
export const DEFAULT_SALES_TIME_ZONE = 'UTC';
export const TOP_PRODUCTS_LIMIT = 5;
/** Variants the inventory report lists as running out, fewest available first. */
export const LOW_STOCK_VARIANTS_LIMIT = 8;
/** Failed listings the listing health report shows, latest first. */
export const RECENT_LISTING_FAILURES_LIMIT = 6;
