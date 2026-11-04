import { Injectable } from '@nestjs/common';
import { SALES_RANGE_SPECS } from '../analytics.constants.js';
import type { SalesReport, SalesReportQuery } from '../entities/sales-report.js';
import type { BucketRow, PeriodBounds, SalesScope } from '../entities/sales-scope.js';
import { SalesRepository } from '../repositories/sales.repository.js';
import {
  toSalesBuckets,
  toSalesStores,
  toSalesTotals,
  toTopProducts,
} from './sales-report.builder.js';

interface PeriodSales {
  bounds: PeriodBounds;
  rows: BucketRow[];
  units: number;
}

/**
 * The sales report on the overview: order totals in the workspace currency, bucketed in the
 * viewer's time zone, compared with the period before. Cancelled orders are left out.
 */
@Injectable()
export class SalesAnalyticsService {
  constructor(private readonly sales: SalesRepository) {}

  async report(workspaceId: string, query: SalesReportQuery): Promise<SalesReport> {
    const spec = SALES_RANGE_SPECS[query.range];
    const currencyCode = await this.sales.workspaceCurrency(workspaceId);
    const scope: SalesScope = { workspaceId, currencyCode, timeZone: query.timeZone, spec };
    const [current, previous, stores] = await Promise.all([
      this.period(scope, 0),
      this.period(scope, spec.buckets),
      this.sales.stores(workspaceId),
    ]);
    const [topProducts, otherCurrencyOrders] = await Promise.all([
      this.sales.topProducts(scope, current.bounds),
      this.sales.otherCurrencyOrders(scope, current.bounds),
    ]);
    return {
      range: query.range,
      interval: spec.interval,
      timeZone: query.timeZone,
      currencyCode,
      current: toSalesTotals(current.rows, current.units),
      previous: toSalesTotals(previous.rows, previous.units),
      buckets: toSalesBuckets(current.rows, previous.rows),
      stores: toSalesStores(stores, current.rows),
      topProducts: toTopProducts(topProducts),
      otherCurrencyOrders,
    };
  }

  private async period(scope: SalesScope, offset: number): Promise<PeriodSales> {
    const [bounds, rows] = await Promise.all([
      this.sales.periodBounds(scope, offset),
      this.sales.bucketRows(scope, offset),
    ]);
    return { bounds, rows, units: await this.sales.unitsSold(scope, bounds) };
  }
}
