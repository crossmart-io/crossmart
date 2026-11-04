import type { SalesInterval } from '../enums/sales-interval.enum.js';
import type { SalesRange } from '../enums/sales-range.enum.js';

export interface SalesReportQuery {
  range: SalesRange;
  /**
   * IANA time zone the buckets follow, such as `America/New_York`. Defaults to the workspace's
   * time zone, else UTC.
   */
  timeZone?: string;
}

export interface SalesTotals {
  /** Order totals in the workspace currency, cancelled orders left out. */
  sales: string;
  orders: number;
  units: number;
  /** Sales per order; null without orders. */
  averageOrderValue: string | null;
}

export interface ConnectionSales {
  connectionId: string;
  sales: string;
  orders: number;
}

export interface SalesBucket {
  /** The bucket's first day, in the report's time zone (`YYYY-MM-DD`). */
  startsOn: string;
  sales: string;
  orders: number;
  /** The matching bucket of the previous period, for comparison. */
  previousStartsOn: string;
  previousSales: string;
  byConnection: ConnectionSales[];
}

export interface SalesStore extends ConnectionSales {
  channel: string;
  displayName: string;
}

export interface TopProduct {
  productId: string;
  title: string;
  units: number;
  /** Units times their unit price, before order-level discounts, tax and shipping. */
  sales: string;
}

export interface SalesReport {
  range: SalesRange;
  interval: SalesInterval;
  timeZone: string;
  currencyCode: string;
  current: SalesTotals;
  previous: SalesTotals;
  buckets: SalesBucket[];
  /** Every store of the workspace, oldest first, so each keeps its color. */
  stores: SalesStore[];
  topProducts: TopProduct[];
  /** Orders in the period in another currency, which the report leaves out. */
  otherCurrencyOrders: number;
}
