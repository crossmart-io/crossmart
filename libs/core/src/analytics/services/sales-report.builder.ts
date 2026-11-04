import { Prisma } from '@crossmart/database';
import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import type {
  ConnectionSales,
  SalesBucket,
  SalesStore,
  SalesTotals,
  TopProduct,
} from '../entities/sales-report.js';
import type { BucketRow, StoreRow, TopProductRow } from '../entities/sales-scope.js';

interface BucketSums {
  startsOn: string;
  sales: Prisma.Decimal;
  orders: number;
  byConnection: ConnectionSales[];
}

const ZERO = new Prisma.Decimal(0);

/** Folds per-store rows into one entry per bucket, in bucket order. */
function sumBuckets(rows: BucketRow[]): BucketSums[] {
  const buckets: BucketSums[] = [];
  for (const row of rows) {
    const bucket = (buckets[row.idx] ??= {
      startsOn: row.startsOn,
      sales: ZERO,
      orders: 0,
      byConnection: [],
    });
    if (!row.connectionId) continue;
    bucket.sales = bucket.sales.plus(row.sales);
    bucket.orders += row.orders;
    bucket.byConnection.push({
      connectionId: row.connectionId,
      sales: toAmount(row.sales),
      orders: row.orders,
    });
  }
  return buckets;
}

/** The current period's buckets, each with the matching bucket of the previous period. */
export function toSalesBuckets(current: BucketRow[], previous: BucketRow[]): SalesBucket[] {
  const before = sumBuckets(previous);
  return sumBuckets(current).map((bucket, idx) => ({
    startsOn: bucket.startsOn,
    sales: toAmount(bucket.sales),
    orders: bucket.orders,
    previousStartsOn: before[idx]?.startsOn ?? bucket.startsOn,
    previousSales: toAmount(before[idx]?.sales ?? ZERO),
    byConnection: bucket.byConnection,
  }));
}

export function toSalesTotals(rows: BucketRow[], units: number): SalesTotals {
  const sales = rows.reduce((sum, row) => sum.plus(row.sales), ZERO);
  const orders = rows.reduce((sum, row) => sum + row.orders, 0);
  return {
    sales: toAmount(sales),
    orders,
    units,
    averageOrderValue: orders > 0 ? toAmount(sales.dividedBy(orders)) : null,
  };
}

/** Every store with its period sales, zero for stores without orders. */
export function toSalesStores(stores: StoreRow[], rows: BucketRow[]): SalesStore[] {
  return stores.map((store) => {
    const own = rows.filter((row) => row.connectionId === store.id);
    return {
      connectionId: store.id,
      channel: store.channel,
      displayName: store.displayName,
      sales: toAmount(own.reduce((sum, row) => sum.plus(row.sales), ZERO)),
      orders: own.reduce((sum, row) => sum + row.orders, 0),
    };
  });
}

export function toTopProducts(rows: TopProductRow[]): TopProduct[] {
  return rows.map((row) => ({ ...row, sales: toAmount(row.sales) }));
}
