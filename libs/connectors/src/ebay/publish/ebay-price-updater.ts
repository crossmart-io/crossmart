import { Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { PriceUpdate } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isSuccessStatus } from '../../sdk/http/http-status.js';
import { type EbayAccountContext, ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { describeEbayErrors } from '../api/ebay-api-error.js';
import { EBAY_BULK_PRICE_MAX_SKUS, EBAY_BULK_PRICE_QUANTITY_PATH } from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { ebayError } from '../ebay-errors.js';
import { EbayOfferClient } from './ebay-offer.client.js';
import { ebayBulkPriceResponseSchema } from './ebay-offer.types.js';

const NO_OFFER = 'eBay has no offer for SKU';
const PUBLISH_AGAIN = 'Publish the listing again.';
const PRICES_REJECTED = 'eBay rejected some prices';
const DETAIL_SEPARATOR = ': ';

/** A price for one offer, as `bulk_update_price_quantity` takes it. */
interface OfferPrice {
  sku: string;
  offerId: string;
  price: string;
}

/**
 * Sends prices with `bulk_update_price_quantity`, 25 SKUs per call. Offers are found by SKU,
 * as Crossmart stores none of their ids. The listing is revised in place; compare-at prices are
 * not sent, as eBay only shows them under its strikethrough pricing programme.
 */
@Injectable()
export class EbayPriceUpdater {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
    private readonly offers: EbayOfferClient,
  ) {}

  async update(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    if (updates.length === 0) return;
    const account = await ebayAccountContext(session);
    const prices = await this.offerPrices(account, updates);
    for (const batch of chunk(prices, EBAY_BULK_PRICE_MAX_SKUS)) {
      await this.send(account, batch);
    }
  }

  private async offerPrices(
    account: EbayAccountContext,
    updates: readonly PriceUpdate[],
  ): Promise<OfferPrice[]> {
    const prices: OfferPrice[] = [];
    for (const update of updates) {
      const sku = update.externalVariantId;
      const offer = await this.offers.find(account, sku);
      if (!offer) {
        throw ebayError(ChannelErrorCode.RequestRejected, `${NO_OFFER} ${sku}. ${PUBLISH_AGAIN}`);
      }
      prices.push({ sku, offerId: offer.offerId, price: update.price });
    }
    return prices;
  }

  private async send(account: EbayAccountContext, batch: readonly OfferPrice[]): Promise<void> {
    const currency = account.marketplace.currencyCode;
    const { responses } = await this.api.call(
      {
        method: HttpMethod.Post,
        url: new URL(EBAY_BULK_PRICE_QUANTITY_PATH, this.app.hosts().api),
        accessToken: account.accessToken,
        body: {
          requests: batch.map(({ sku, offerId, price }) => ({
            sku,
            offers: [{ offerId, price: { value: price, currency } }],
          })),
        },
      },
      ebayBulkPriceResponseSchema,
    );
    const failed = responses.filter((response) => !isSuccessStatus(response.statusCode));
    if (failed.length > 0) {
      const detail = describeEbayErrors(failed.flatMap((response) => response.errors ?? []));
      const message = detail ? `${PRICES_REJECTED}${DETAIL_SEPARATOR}${detail}` : PRICES_REJECTED;
      throw ebayError(ChannelErrorCode.RequestRejected, message);
    }
  }
}
