import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { ChannelPage } from '../../sdk/capabilities/catalog.types.js';
import type { ExternalOrder, OrderSource } from '../../sdk/capabilities/order-source.js';
import { MercadoLibreApiClient } from '../api/mercadolibre-api.client.js';
import {
  MERCADOLIBRE_ORDER_PATH,
  MERCADOLIBRE_ORDERS_PAGE_SIZE,
  MERCADOLIBRE_ORDERS_SEARCH_PATH,
  MERCADOLIBRE_SORT_DATE_ASCENDING,
  MERCADOLIBRE_UTC_OFFSET,
  MercadoLibrePathParam,
  MercadoLibreQueryParam,
  UTC_DESIGNATOR,
} from '../mercadolibre.constants.js';
import { toExternalOrder } from './mercadolibre-order.mapper.js';
import {
  mercadoLibreOrderSchema,
  mercadoLibreOrdersPageSchema,
} from './mercadolibre-order.types.js';

/** The first page of a poll starts at offset 0. */
const FIRST_OFFSET = 0;

/** A time as Mercado Libre's date filters show it: `2015-07-01T00:00:00.000-00:00`. */
function filterDate(date: Date): string {
  return date.toISOString().replace(UTC_DESIGNATOR, MERCADOLIBRE_UTC_OFFSET);
}

/**
 * Reads the seller's orders. Polling searches orders updated since a time, 50 per page; the
 * cursor is the next page's offset. Mercado Libre leaves cancelled orders out of a seller's
 * search, so cancellations arrive through `orders_v2` notifications, read one by one.
 */
@Injectable()
export class MercadoLibreOrderSource implements OrderSource {
  constructor(private readonly api: MercadoLibreApiClient) {}

  async fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    const offset = cursor === null ? FIRST_OFFSET : Number(cursor);
    const page = await this.api.get(
      {
        accessToken: await session.accessToken(),
        path: MERCADOLIBRE_ORDERS_SEARCH_PATH,
        query: {
          [MercadoLibreQueryParam.Seller]: session.externalAccountId,
          [MercadoLibreQueryParam.LastUpdatedFrom]: filterDate(updatedSince),
          [MercadoLibreQueryParam.Sort]: MERCADOLIBRE_SORT_DATE_ASCENDING,
          [MercadoLibreQueryParam.Limit]: String(MERCADOLIBRE_ORDERS_PAGE_SIZE),
          [MercadoLibreQueryParam.Offset]: String(offset),
        },
      },
      mercadoLibreOrdersPageSchema,
    );
    const next = offset + page.results.length;
    const hasMore = page.results.length > 0 && next < page.paging.total;
    return {
      items: page.results.map(toExternalOrder),
      nextCursor: hasMore ? String(next) : null,
      totalCount: page.paging.total,
    };
  }

  /** One order by id; null when Mercado Libre does not have it. */
  async fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    const order = await this.api.find(
      {
        accessToken: await session.accessToken(),
        path: MERCADOLIBRE_ORDER_PATH,
        params: { [MercadoLibrePathParam.OrderId]: externalId },
      },
      mercadoLibreOrderSchema,
    );
    return order ? toExternalOrder(order) : null;
  }
}
