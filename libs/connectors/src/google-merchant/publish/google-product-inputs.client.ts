import { Injectable } from '@nestjs/common';
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { GoogleMerchantApiClient } from '../api/google-merchant-api.client.js';
import {
  ACCOUNTS_RESOURCE_PREFIX,
  DATA_SOURCE_PARAM,
  DATA_SOURCES_RESOURCE_SEGMENT,
  PRICE_UPDATE_MASK,
  PRODUCT_INPUTS_INSERT_SUFFIX,
  PRODUCT_INPUTS_SUFFIX,
  PRODUCT_NAME_SEPARATOR,
  PRODUCTS_API_PATH,
  UPDATE_MASK_PARAM,
} from '../google-merchant.constants.js';
import type { GooglePrice, GoogleProductInput } from './google-product-input.js';

const BASE64_URL = 'base64url';
const PATH_SEPARATOR = '/';

/** Where offers are written: the account, its API data source, and the offers' feed. */
export interface GoogleFeed {
  accountId: string;
  dataSourceId: string;
  contentLanguage: string;
  feedLabel: string;
}

/**
 * An offer's id in resource names: `{contentLanguage}~{feedLabel}~{offerId}`, unpadded
 * base64url encoded as Google recommends, so offer ids with `/`, `%` or `~` stay safe.
 */
export function productInputId(feed: GoogleFeed, offerId: string): string {
  const name = [feed.contentLanguage, feed.feedLabel, offerId].join(PRODUCT_NAME_SEPARATOR);
  return Buffer.from(name).toString(BASE64_URL);
}

/** Writes offers through `productInputs` in the products sub-API, one call per offer. */
@Injectable()
export class GoogleProductInputsClient {
  constructor(private readonly api: GoogleMerchantApiClient) {}

  /** Creates the offer, or replaces it entirely when it exists. */
  insert(accessToken: string, feed: GoogleFeed, input: GoogleProductInput): Promise<void> {
    return this.api.execute({
      method: HttpMethod.Post,
      path: `${PRODUCTS_API_PATH}${feed.accountId}${PRODUCT_INPUTS_INSERT_SUFFIX}`,
      query: this.dataSource(feed),
      accessToken,
      body: input,
    });
  }

  /** Changes only the price and sale price; a sale price left out is removed. */
  updatePrice(
    accessToken: string,
    feed: GoogleFeed,
    offerId: string,
    prices: { price: GooglePrice; salePrice?: GooglePrice },
  ): Promise<void> {
    return this.api.execute({
      method: HttpMethod.Patch,
      path: this.inputPath(feed, offerId),
      query: { ...this.dataSource(feed), [UPDATE_MASK_PARAM]: PRICE_UPDATE_MASK },
      accessToken,
      body: { productAttributes: prices },
    });
  }

  /** Removes the offer from the data source, and so from Google. One already gone is fine. */
  async delete(accessToken: string, feed: GoogleFeed, offerId: string): Promise<void> {
    const response = await this.api.request({
      method: HttpMethod.Delete,
      path: this.inputPath(feed, offerId),
      query: this.dataSource(feed),
      accessToken,
    });
    if (response.status !== HTTP_STATUS_NOT_FOUND) this.api.assertSuccess(response);
  }

  private inputPath(feed: GoogleFeed, offerId: string): string {
    const id = productInputId(feed, offerId);
    return `${PRODUCTS_API_PATH}${feed.accountId}${PRODUCT_INPUTS_SUFFIX}${PATH_SEPARATOR}${id}`;
  }

  private dataSource(feed: GoogleFeed): Record<string, string> {
    const name = `${ACCOUNTS_RESOURCE_PREFIX}${feed.accountId}${DATA_SOURCES_RESOURCE_SEGMENT}${feed.dataSourceId}`;
    return { [DATA_SOURCE_PARAM]: name };
  }
}
