import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import type { InventoryReport, SalesReport, SalesReportQuery } from '../types.js';
import { Resource } from './resource.js';

const SALES_REPORT_PATH = '/api/v1/workspaces/{workspaceId}/analytics/sales';
const INVENTORY_REPORT_PATH = '/api/v1/workspaces/{workspaceId}/analytics/inventory';

/** Sales and stock reports. Needs `reports:view`. */
export class ReportsResource extends Resource {
  /**
   * Sales, orders, average order value and units over a range, against the period before,
   * with a breakdown per day, store and product.
   *
   * @example
   * ```ts
   * const report = await crossmart.reports.sales({ range: SalesRange.last_7_days });
   * console.log(report.current, report.previous);
   * ```
   */
  async sales(query: SalesReportQuery = {}, options?: RequestOptions): Promise<SalesReport> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(SALES_REPORT_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Stock value, stock levels and listings per store.
   *
   * @example
   * ```ts
   * const report = await crossmart.reports.inventory();
   * ```
   */
  async inventory(options?: RequestOptions): Promise<InventoryReport> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(INVENTORY_REPORT_PATH, {
        params: { path: { workspaceId } },
        signal: options?.signal,
      }),
    );
  }
}
