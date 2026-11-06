import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { ChannelPage } from '../../sdk/capabilities/catalog.types.js';
import type { ExternalOrder, OrderSource } from '../../sdk/capabilities/order-source.js';
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { MILLISECONDS_PER_SECOND } from '../../sdk/time/time.constants.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import { etsyShopContext, shopParams } from '../api/etsy-shop-context.js';
import {
  ETSY_PAGE_SIZE_MAX,
  ETSY_RECEIPT_PATH,
  ETSY_RECEIPTS_PATH,
  ETSY_SORT_ASCENDING,
  ETSY_SORT_ON_UPDATED,
  EtsyPathParam,
  EtsyQueryParam,
} from '../etsy.constants.js';
import { toExternalOrder } from './etsy-receipt.mapper.js';
import { etsyReceiptSchema, etsyReceiptsPageSchema } from './etsy-receipt.types.js';

/** The first page of a poll starts at offset 0. */
const FIRST_OFFSET = 0;

/**
 * Reads the shop's orders (receipts and their transactions) with the `transactions_r` scope,
 * requested at connect. Polling asks for receipts changed since a time, oldest change first,
 * 100 per page; the cursor is the offset of the next page.
 */
@Injectable()
export class EtsyOrderSource implements OrderSource {
  constructor(private readonly api: EtsyApiClient) {}

  async fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    const shop = await etsyShopContext(session);
    const offset = cursor === null ? FIRST_OFFSET : Number(cursor);
    const page = await this.api.get(
      {
        path: ETSY_RECEIPTS_PATH,
        params: shopParams(shop),
        accessToken: shop.accessToken,
        query: {
          [EtsyQueryParam.MinLastModified]: String(
            Math.floor(updatedSince.getTime() / MILLISECONDS_PER_SECOND),
          ),
          [EtsyQueryParam.SortOn]: ETSY_SORT_ON_UPDATED,
          [EtsyQueryParam.SortOrder]: ETSY_SORT_ASCENDING,
          [EtsyQueryParam.Limit]: String(ETSY_PAGE_SIZE_MAX),
          [EtsyQueryParam.Offset]: String(offset),
        },
      },
      etsyReceiptsPageSchema,
    );
    const next = offset + page.results.length;
    const hasMore = page.results.length > 0 && next < page.count;
    return {
      items: page.results.map(toExternalOrder),
      nextCursor: hasMore ? String(next) : null,
      totalCount: page.count,
    };
  }

  /** One receipt by id; null when Etsy does not have it. */
  async fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    const shop = await etsyShopContext(session);
    const response = await this.api.request({
      method: HttpMethod.Get,
      path: ETSY_RECEIPT_PATH,
      params: { ...shopParams(shop), [EtsyPathParam.ReceiptId]: externalId },
      accessToken: shop.accessToken,
    });
    if (response.status === HTTP_STATUS_NOT_FOUND) return null;
    return toExternalOrder(this.api.parse(response, etsyReceiptSchema));
  }
}
