import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import type { EtsyShopContext } from '../api/etsy-shop-context.js';
import { ETSY_LISTING_INVENTORY_PATH, EtsyPathParam, EtsyQueryParam } from '../etsy.constants.js';
import { EtsyInventoryEdit } from './etsy-inventory-edit.js';
import {
  type EtsyInventory,
  type EtsyInventoryInput,
  etsyInventorySchema,
} from './etsy-listing.types.js';

/** A listing's products, prices and stock (`getListingInventory`, `updateListingInventory`). */
@Injectable()
export class EtsyInventoryClient {
  constructor(private readonly api: EtsyApiClient) {}

  read(shop: EtsyShopContext, listingId: string): Promise<EtsyInventory> {
    return this.api.get(
      {
        path: ETSY_LISTING_INVENTORY_PATH,
        params: { [EtsyPathParam.ListingId]: listingId },
        accessToken: shop.accessToken,
      },
      etsyInventorySchema,
    );
  }

  /**
   * Reads the inventory, lets `change` edit it SKU by SKU, and writes it back when anything
   * changed: Etsy replaces the whole inventory on each write.
   */
  async modify<TResult>(
    shop: EtsyShopContext,
    listingId: string,
    change: (edit: EtsyInventoryEdit) => TResult,
  ): Promise<TResult> {
    const edit = EtsyInventoryEdit.of(await this.read(shop, listingId));
    const result = change(edit);
    if (edit.hasChanges) {
      await this.write(shop, listingId, edit.body, edit.maxVariations);
    }
    return result;
  }

  /** Replaces every product of the listing; JSON, unlike the listing writes. */
  write(
    shop: EtsyShopContext,
    listingId: string,
    body: EtsyInventoryInput,
    maxVariations: string | null,
  ): Promise<EtsyInventory> {
    return this.api.call(
      {
        method: HttpMethod.Put,
        path: ETSY_LISTING_INVENTORY_PATH,
        params: { [EtsyPathParam.ListingId]: listingId },
        query: maxVariations ? { [EtsyQueryParam.MaxVariationsSupported]: maxVariations } : {},
        accessToken: shop.accessToken,
        body,
      },
      etsyInventorySchema,
    );
  }
}
