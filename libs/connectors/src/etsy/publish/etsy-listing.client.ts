import { Injectable } from '@nestjs/common';
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import { type EtsyShopContext, shopParams } from '../api/etsy-shop-context.js';
import {
  ETSY_LISTING_PATH,
  ETSY_SHOP_LISTING_PATH,
  ETSY_SHOP_LISTINGS_PATH,
  EtsyPathParam,
} from '../etsy.constants.js';
import { type EtsyListing, etsyListingSchema } from './etsy-listing.types.js';

/** Creates, edits and reads a shop's listings (`createDraftListing`, `updateListing`, `getListing`). */
@Injectable()
export class EtsyListingClient {
  constructor(private readonly api: EtsyApiClient) {}

  /** A new draft listing; Etsy takes these writes form-encoded only. */
  createDraft(shop: EtsyShopContext, fields: Record<string, string>): Promise<EtsyListing> {
    return this.api.call(
      {
        method: HttpMethod.Post,
        path: ETSY_SHOP_LISTINGS_PATH,
        params: shopParams(shop),
        accessToken: shop.accessToken,
        form: fields,
      },
      etsyListingSchema,
    );
  }

  update(
    shop: EtsyShopContext,
    listingId: string,
    fields: Record<string, string>,
  ): Promise<EtsyListing> {
    return this.api.call(
      {
        method: HttpMethod.Patch,
        path: ETSY_SHOP_LISTING_PATH,
        params: { ...shopParams(shop), [EtsyPathParam.ListingId]: listingId },
        accessToken: shop.accessToken,
        form: fields,
      },
      etsyListingSchema,
    );
  }

  /** The listing, or null when Etsy no longer has it. */
  async find(shop: EtsyShopContext, listingId: string): Promise<EtsyListing | null> {
    const response = await this.api.request({
      method: HttpMethod.Get,
      path: ETSY_LISTING_PATH,
      params: { [EtsyPathParam.ListingId]: listingId },
      accessToken: shop.accessToken,
    });
    if (response.status === HTTP_STATUS_NOT_FOUND) return null;
    return this.api.parse(response, etsyListingSchema);
  }
}
