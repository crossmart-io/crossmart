import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { ChannelPage } from '../../sdk/capabilities/catalog.types.js';
import type { ExternalOrder } from '../../sdk/capabilities/order-source.js';
import { type FalabellaAccount, falabellaAccount } from '../api/falabella-account.js';
import { FalabellaApiClient } from '../api/falabella-api.client.js';
import { falabellaTimestamp } from '../api/falabella-signature.js';
import {
  FALABELLA_ORDERS_PAGE_SIZE,
  FalabellaParam,
  LIST_PARAM_SEPARATOR,
} from '../falabella.constants.js';
import {
  FalabellaAction,
  FalabellaOrderSort,
  FalabellaShippingType,
  FalabellaSortDirection,
} from '../falabella.enums.js';
import { falabellaCountry } from '../falabella-countries.js';
import { toExternalOrder } from './falabella-order.mapper.js';
import {
  type FalabellaOrder,
  type FalabellaOrderItem,
  multipleOrderItemsBodySchema,
  orderItemsBodySchema,
  ordersBodySchema,
} from './falabella-order.types.js';

const LIST_OPEN = '[';
const LIST_CLOSE = ']';

/**
 * Reads the seller's orders, oldest change first, a page at a time with their items. Only
 * orders the seller ships are read: Falabella ships the others from its own warehouse, so they
 * do not move the seller's stock.
 */
@Injectable()
export class FalabellaOrderSource {
  constructor(private readonly api: FalabellaApiClient) {}

  async fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    const account = await falabellaAccount(session);
    const offset = Number(cursor ?? 0);
    const { head, body } = await this.api.call(
      account,
      { action: FalabellaAction.GetOrders, params: ordersPageParams(updatedSince, offset) },
      ordersBodySchema,
    );
    const orders = body.Orders?.Order ?? [];
    const items = await this.itemsOf(account, orders);
    const country = falabellaCountry(account.country);
    return {
      items: orders.map((order) => toExternalOrder(order, items.get(order.OrderId) ?? [], country)),
      nextCursor:
        orders.length === FALABELLA_ORDERS_PAGE_SIZE ? String(offset + orders.length) : null,
      totalCount: head.TotalCount ? Number(head.TotalCount) : null,
    };
  }

  async fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    const account = await falabellaAccount(session);
    const params = { [FalabellaParam.OrderId]: externalId };
    const { body } = await this.api.call(
      account,
      { action: FalabellaAction.GetOrder, params },
      ordersBodySchema,
    );
    const [order] = body.Orders?.Order ?? [];
    if (!order) return null;
    const items = await this.api.call(
      account,
      { action: FalabellaAction.GetOrderItems, params },
      orderItemsBodySchema,
    );
    const lines = items.body.OrderItems?.OrderItem ?? [];
    return toExternalOrder(order, lines, falabellaCountry(account.country));
  }

  /** The items of a page of orders, in one call, by order id. */
  private async itemsOf(
    account: FalabellaAccount,
    orders: readonly FalabellaOrder[],
  ): Promise<Map<string, FalabellaOrderItem[]>> {
    if (orders.length === 0) return new Map();
    const ids = orders.map((order) => order.OrderId).join(LIST_PARAM_SEPARATOR);
    const { body } = await this.api.call(
      account,
      {
        action: FalabellaAction.GetMultipleOrderItems,
        params: { [FalabellaParam.OrderIdList]: `${LIST_OPEN}${ids}${LIST_CLOSE}` },
      },
      multipleOrderItemsBodySchema,
    );
    return new Map(
      (body.Orders?.Order ?? []).map((order) => [order.OrderId, order.OrderItems?.OrderItem ?? []]),
    );
  }
}

function ordersPageParams(updatedSince: Date, offset: number): Record<string, string> {
  return {
    [FalabellaParam.UpdatedAfter]: falabellaTimestamp(updatedSince),
    [FalabellaParam.SortBy]: FalabellaOrderSort.UpdatedAt,
    [FalabellaParam.SortDirection]: FalabellaSortDirection.Ascending,
    [FalabellaParam.ShippingType]: FalabellaShippingType.Dropshipping,
    [FalabellaParam.Limit]: String(FALABELLA_ORDERS_PAGE_SIZE),
    [FalabellaParam.Offset]: String(offset),
  };
}
