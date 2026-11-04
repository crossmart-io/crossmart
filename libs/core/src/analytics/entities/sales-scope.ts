import type { Prisma } from '@crossmart/database';
import type { SalesRangeSpec } from '../analytics.constants.js';

/** What one report reads: a workspace's orders in one currency, bucketed in one time zone. */
export interface SalesScope {
  workspaceId: string;
  currencyCode: string;
  timeZone: string;
  spec: SalesRangeSpec;
}

/** A period's instants, `from` included and `to` excluded. */
export interface PeriodBounds {
  from: Date;
  to: Date;
}

export interface BucketRow {
  idx: number;
  startsOn: string;
  /** Null for a bucket without orders. */
  connectionId: string | null;
  sales: Prisma.Decimal;
  orders: number;
}

export interface TopProductRow {
  productId: string;
  title: string;
  units: number;
  sales: Prisma.Decimal;
}

export interface StoreRow {
  id: string;
  channel: string;
  displayName: string;
}
