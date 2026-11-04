import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { HTTP_STATUS_CONFLICT } from '../../sdk/http/http.constants.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { ebayErrorIds } from '../api/ebay-api-error.js';
import {
  EBAY_LOCATION_EXISTS_ERROR_IDS,
  EBAY_LOCATION_NAME,
  EBAY_LOCATION_PATH,
  EBAY_MERCHANT_LOCATION_KEY,
  EBAY_UPDATE_LOCATION_SUFFIX,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import type { EbayShipFrom } from '../listing/ebay-listing-defaults.js';

/** The kinds of inventory location; Crossmart's ships items and has no storefront. */
export enum EbayLocationType {
  Warehouse = 'WAREHOUSE',
}

/**
 * Keeps the connection's ship-from address as an eBay inventory location, under one key.
 * Creating it again updates its address, so saving the defaults twice is harmless.
 */
@Injectable()
export class EbayLocationWriter {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  /** Creates or updates the location; answers its `merchantLocationKey`. */
  async save(session: ChannelSession, shipFrom: EbayShipFrom): Promise<string> {
    const { accessToken } = await ebayAccountContext(session);
    const address = this.address(shipFrom);
    const created = await this.api.request({
      method: HttpMethod.Post,
      url: this.url(''),
      accessToken,
      body: {
        location: { address },
        locationTypes: [EbayLocationType.Warehouse],
        name: EBAY_LOCATION_NAME,
      },
    });
    if (!this.exists(created)) {
      this.api.assertSuccess(created);
      return EBAY_MERCHANT_LOCATION_KEY;
    }
    await this.api.execute({
      method: HttpMethod.Post,
      url: this.url(EBAY_UPDATE_LOCATION_SUFFIX),
      accessToken,
      body: { location: { address }, name: EBAY_LOCATION_NAME },
    });
    return EBAY_MERCHANT_LOCATION_KEY;
  }

  private address({ postalCode, country, city }: EbayShipFrom): Record<string, string> {
    return { postalCode, country, ...(city ? { city } : {}) };
  }

  private exists(response: HttpResponse): boolean {
    if (response.status === HTTP_STATUS_CONFLICT) return true;
    return ebayErrorIds(response).some((errorId) => EBAY_LOCATION_EXISTS_ERROR_IDS.has(errorId));
  }

  private url(suffix: string): URL {
    const key = encodeURIComponent(EBAY_MERCHANT_LOCATION_KEY);
    return new URL(`${EBAY_LOCATION_PATH}${key}${suffix}`, this.app.hosts().api);
  }
}
