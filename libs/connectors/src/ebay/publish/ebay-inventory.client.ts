import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { EBAY_INVENTORY_ITEM_GROUP_PATH, EBAY_INVENTORY_ITEM_PATH } from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import type { EbayAccountContext } from '../api/ebay-account-context.js';
import type { EbayInventoryItemBody, EbayInventoryItemGroupBody } from './ebay-inventory.types.js';

/**
 * Writes inventory items and groups. Both calls create or replace by key, so sending them
 * again is harmless; inventory items are kept when a listing ends.
 */
@Injectable()
export class EbayInventoryClient {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  putItem(account: EbayAccountContext, sku: string, item: EbayInventoryItemBody): Promise<void> {
    return this.put(account, `${EBAY_INVENTORY_ITEM_PATH}${encodeURIComponent(sku)}`, item);
  }

  putGroup(
    account: EbayAccountContext,
    groupKey: string,
    group: EbayInventoryItemGroupBody,
  ): Promise<void> {
    return this.put(
      account,
      `${EBAY_INVENTORY_ITEM_GROUP_PATH}${encodeURIComponent(groupKey)}`,
      group,
    );
  }

  private put(account: EbayAccountContext, path: string, body: unknown): Promise<void> {
    return this.api.execute({
      method: HttpMethod.Put,
      url: new URL(path, this.app.hosts().api),
      accessToken: account.accessToken,
      contentLanguage: account.marketplace.contentLanguage,
      body,
    });
  }
}
