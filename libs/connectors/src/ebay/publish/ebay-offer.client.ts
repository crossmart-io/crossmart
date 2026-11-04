import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { EbayApiClient, type EbayRequest } from '../api/ebay-api.client.js';
import { ebayErrorIds } from '../api/ebay-api-error.js';
import {
  EBAY_MARKETPLACE_ID_PARAM,
  EBAY_NO_OFFER_ERROR_IDS,
  EBAY_OFFER_PATH,
  EBAY_PUBLISH_GROUP_PATH,
  EBAY_PUBLISH_SUFFIX,
  EBAY_SKU_PARAM,
  EBAY_WITHDRAW_GROUP_PATH,
  EBAY_WITHDRAW_SUFFIX,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import type { EbayAccountContext } from '../api/ebay-account-context.js';
import { toNewOffer } from './ebay-offer.mapper.js';
import {
  type EbayOffer,
  type EbayOfferDetails,
  ebayCreatedOfferSchema,
  ebayOffersResponseSchema,
  ebayPublishedSchema,
} from './ebay-offer.types.js';

/**
 * Offers: a SKU's sale terms on a marketplace. Crossmart does not store offer ids; it finds
 * them by SKU (`GET /offer?sku=`), so a listing's only ids on eBay are its SKUs and listing id.
 */
@Injectable()
export class EbayOfferClient {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  /** The SKU's offer on the account's marketplace, or null when it has none yet. */
  async find(account: EbayAccountContext, sku: string): Promise<EbayOffer | null> {
    const url = this.url(EBAY_OFFER_PATH);
    url.searchParams.set(EBAY_SKU_PARAM, sku);
    url.searchParams.set(EBAY_MARKETPLACE_ID_PARAM, account.marketplaceId);
    const response = await this.api.request(this.request(account, HttpMethod.Get, url));
    if (this.hasNoOffer(response)) return null;
    const { offers } = this.api.parse(response, ebayOffersResponseSchema);
    return offers.find((offer) => offer.sku === sku) ?? null;
  }

  /** Updates the SKU's offer, or creates it; either way, its id. */
  async save(account: EbayAccountContext, sku: string, details: EbayOfferDetails): Promise<string> {
    const existing = await this.find(account, sku);
    if (existing) {
      const url = this.url(`${EBAY_OFFER_PATH}/${encodeURIComponent(existing.offerId)}`);
      await this.api.execute(this.request(account, HttpMethod.Put, url, details));
      return existing.offerId;
    }
    const body = toNewOffer(sku, account.marketplaceId, details);
    const url = this.url(EBAY_OFFER_PATH);
    const created = await this.api.call(
      this.request(account, HttpMethod.Post, url, body),
      ebayCreatedOfferSchema,
    );
    return created.offerId;
  }

  /** Lists one offer, or revises its live listing; answers the listing id. */
  async publish(account: EbayAccountContext, offerId: string): Promise<string> {
    const url = this.offerActionUrl(offerId, EBAY_PUBLISH_SUFFIX);
    const published = await this.api.call(
      this.request(account, HttpMethod.Post, url),
      ebayPublishedSchema,
    );
    return published.listingId;
  }

  /** Lists every offer of a group as one multi-variant listing; answers the listing id. */
  async publishGroup(account: EbayAccountContext, groupKey: string): Promise<string> {
    const body = { inventoryItemGroupKey: groupKey, marketplaceId: account.marketplaceId };
    const url = this.url(EBAY_PUBLISH_GROUP_PATH);
    const published = await this.api.call(
      this.request(account, HttpMethod.Post, url, body),
      ebayPublishedSchema,
    );
    return published.listingId;
  }

  /** Ends one offer's listing; the offer and its inventory item are kept. */
  withdraw(account: EbayAccountContext, offerId: string): Promise<void> {
    const url = this.offerActionUrl(offerId, EBAY_WITHDRAW_SUFFIX);
    return this.api.execute(this.request(account, HttpMethod.Post, url));
  }

  /** Ends a multi-variant listing; its offers and items are kept. */
  withdrawGroup(account: EbayAccountContext, groupKey: string): Promise<void> {
    const body = { inventoryItemGroupKey: groupKey, marketplaceId: account.marketplaceId };
    const url = this.url(EBAY_WITHDRAW_GROUP_PATH);
    return this.api.execute(this.request(account, HttpMethod.Post, url, body));
  }

  private hasNoOffer(response: HttpResponse): boolean {
    if (response.status === HTTP_STATUS_NOT_FOUND) return true;
    return ebayErrorIds(response).some((errorId) => EBAY_NO_OFFER_ERROR_IDS.has(errorId));
  }

  private offerActionUrl(offerId: string, suffix: string): URL {
    return this.url(`${EBAY_OFFER_PATH}/${encodeURIComponent(offerId)}${suffix}`);
  }

  private url(path: string): URL {
    return new URL(path, this.app.hosts().api);
  }

  private request(
    account: EbayAccountContext,
    method: HttpMethod,
    url: URL,
    body?: unknown,
  ): EbayRequest {
    return {
      method,
      url,
      accessToken: account.accessToken,
      contentLanguage: account.marketplace.contentLanguage,
      ...(body === undefined ? {} : { body }),
    };
  }
}
