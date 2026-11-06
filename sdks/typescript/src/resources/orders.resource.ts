import { MAX_PAGE_SIZE } from '../crossmart.constants.js';
import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import { type Page, paginate } from '../pagination.js';
import type { ListAllOrdersQuery, ListOrdersQuery, Order, OrderSummary } from '../types.js';
import { Resource } from './resource.js';

const ORDERS_PATH = '/api/v1/workspaces/{workspaceId}/orders';
const ORDER_PATH = '/api/v1/workspaces/{workspaceId}/orders/{orderId}';

/** Orders from every connected store, newest first. Read-only. Needs `orders:view`. */
export class OrdersResource extends Resource {
  /**
   * One page of orders.
   *
   * @example
   * ```ts
   * const page = await crossmart.orders.list({ status: OrderStatus.OPEN, limit: 20 });
   * ```
   */
  async list(query: ListOrdersQuery = {}, options?: RequestOptions): Promise<Page<OrderSummary>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(ORDERS_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Every order that matches `query`.
   *
   * @example
   * ```ts
   * for await (const order of crossmart.orders.listAll({ connectionId })) {
   *   console.log(order.name, order.total, order.currencyCode);
   * }
   * ```
   */
  listAll(
    query: ListAllOrdersQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<OrderSummary, void> {
    return paginate((cursor) => this.list({ limit: MAX_PAGE_SIZE, ...query, cursor }, options));
  }

  /**
   * One order with its lines.
   *
   * @example
   * ```ts
   * const order = await crossmart.orders.get(orderId);
   * console.log(order.lines.map((line) => `${line.quantity} × ${line.title}`));
   * ```
   */
  async get(orderId: string, options?: RequestOptions): Promise<Order> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(ORDER_PATH, {
        params: { path: { workspaceId, orderId } },
        signal: options?.signal,
      }),
    );
  }
}
