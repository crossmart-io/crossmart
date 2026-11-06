import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { ChannelPage } from '../../sdk/capabilities/catalog.types.js';
import type { ExternalOrder, OrderSource } from '../../sdk/capabilities/order-source.js';
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import { type EbayAccountContext, ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import {
  EBAY_ORDER_FILTER_PARAM,
  EBAY_ORDER_LIMIT_PARAM,
  EBAY_ORDER_MODIFIED_FILTER_PREFIX,
  EBAY_ORDER_MODIFIED_FILTER_SUFFIX,
  EBAY_ORDER_OFFSET_PARAM,
  EBAY_ORDER_PATH,
  EBAY_ORDERS_PAGE_SIZE,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { toExternalOrder } from './ebay-order.mapper.js';
import { ebayOrderSchema, ebayOrdersPageSchema } from './ebay-order.types.js';

/** The first page of a poll starts at offset 0. */
const FIRST_OFFSET = 0;

/**
 * Reads the seller's orders with the Fulfillment API (`sell.fulfillment` scope, requested at
 * connect). Polling asks for orders modified since a time, 200 per page; the cursor is the
 * offset of the next page. Orders of the seller's other marketplaces are left out.
 */
@Injectable()
export class EbayOrderSource implements OrderSource {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  async fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    const account = await ebayAccountContext(session);
    const offset = cursor === null ? FIRST_OFFSET : Number(cursor);
    const url = this.ordersUrl(updatedSince, offset);
    const page = await this.api.get(url, account.accessToken, ebayOrdersPageSchema);
    const items = page.orders.flatMap((order) => {
      const external = toExternalOrder(order, account.marketplaceId);
      return external ? [external] : [];
    });
    const hasMore = page.next !== undefined && page.orders.length > 0;
    return { items, nextCursor: hasMore ? String(offset + page.orders.length) : null };
  }

  /** One order by id; null when eBay does not have it or it belongs to another marketplace. */
  async fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    const account = await ebayAccountContext(session);
    return this.readOrder(account, externalId);
  }

  private async readOrder(
    account: EbayAccountContext,
    orderId: string,
  ): Promise<ExternalOrder | null> {
    const url = this.url(`${EBAY_ORDER_PATH}/${encodeURIComponent(orderId)}`);
    const response = await this.api.send(url, account.accessToken);
    if (response.status === HTTP_STATUS_NOT_FOUND) return null;
    const order = this.api.parse(response, ebayOrderSchema);
    return toExternalOrder(order, account.marketplaceId);
  }

  private ordersUrl(updatedSince: Date, offset: number): URL {
    const url = this.url(EBAY_ORDER_PATH);
    const filter = `${EBAY_ORDER_MODIFIED_FILTER_PREFIX}${updatedSince.toISOString()}${EBAY_ORDER_MODIFIED_FILTER_SUFFIX}`;
    url.searchParams.set(EBAY_ORDER_FILTER_PARAM, filter);
    url.searchParams.set(EBAY_ORDER_LIMIT_PARAM, String(EBAY_ORDERS_PAGE_SIZE));
    url.searchParams.set(EBAY_ORDER_OFFSET_PARAM, String(offset));
    return url;
  }

  private url(path: string): URL {
    return new URL(path, this.app.hosts().api);
  }
}
