import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { ChannelPage } from '../../sdk/capabilities/catalog.types.js';
import type { ExternalOrder, OrderSource } from '../../sdk/capabilities/order-source.js';
import { ORDER_QUERY, ORDERS_QUERY } from '../graphql/orders.query.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import {
  SHOPIFY_ORDERS_PAGE_SIZE,
  SHOPIFY_ORDERS_UPDATED_SINCE_FIELD,
  ShopifyScope,
} from '../shopify.constants.js';
import { toExternalOrder } from './shopify-order.mapper.js';

const NO_ORDERS: ChannelPage<ExternalOrder> = { items: [], nextCursor: null };

/**
 * Reads orders with the Admin GraphQL API. Stores that did not grant `read_orders` have none
 * to read, so they cost no call.
 */
@Injectable()
export class ShopifyOrderSource implements OrderSource {
  constructor(private readonly admin: ShopifyAdminClient) {}

  async fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    if (!canReadOrders(session)) return NO_ORDERS;
    const { orders } = await this.admin.request(session, ORDERS_QUERY, {
      first: SHOPIFY_ORDERS_PAGE_SIZE,
      after: cursor,
      query: `${SHOPIFY_ORDERS_UPDATED_SINCE_FIELD}'${updatedSince.toISOString()}'`,
    });
    return {
      items: orders.nodes.map(toExternalOrder),
      nextCursor: orders.pageInfo.hasNextPage ? orders.pageInfo.endCursor : null,
    };
  }

  async fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    if (!canReadOrders(session)) return null;
    const { order } = await this.admin.request(session, ORDER_QUERY, { id: externalId });
    return order ? toExternalOrder(order) : null;
  }
}

function canReadOrders(session: ChannelSession): boolean {
  return session.grantedScopes.includes(ShopifyScope.ReadOrders);
}
