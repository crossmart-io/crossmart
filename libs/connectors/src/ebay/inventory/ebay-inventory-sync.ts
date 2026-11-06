import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { chunk } from '@crossmart/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  InventoryQuantityUpdate,
  InventorySync,
  InventoryUpdateFailure,
} from '../../sdk/capabilities/inventory-sync.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isSuccessStatus } from '../../sdk/http/http-status.js';
import { type EbayAccountContext, ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { describeEbayErrors } from '../api/ebay-api-error.js';
import { EBAY_BULK_PRICE_QUANTITY_PATH, EBAY_BULK_QUANTITY_MAX_SKUS } from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { EbayOfferClient } from '../publish/ebay-offer.client.js';
import {
  type EbayOffer,
  EbayOfferStatus,
  ebayBulkPriceResponseSchema,
} from '../publish/ebay-offer.types.js';

const QUANTITY_REJECTED = 'eBay rejected the quantity';
const DETAIL_SEPARATOR = ': ';

/** The stock to set on one SKU, and its live offer when it has one. */
interface SkuQuantity {
  sku: string;
  quantity: number;
  offerId: string | null;
}

/** A `bulk_update_price_quantity` request for one SKU. */
interface PriceQuantityRequest {
  sku: string;
  shipToLocationAvailability: { quantity: number };
  offers?: { offerId: string; availableQuantity: number }[];
}

type BulkResponse = z.infer<typeof ebayBulkPriceResponseSchema>['responses'][number];

/** Whether the offer's live listing already shows the quantity, so writing it changes nothing. */
function showsAlready(offer: EbayOffer | null, quantity: number): boolean {
  return offer?.status === EbayOfferStatus.Published && offer.availableQuantity === quantity;
}

function toRequest({ sku, quantity, offerId }: SkuQuantity): PriceQuantityRequest {
  return {
    sku,
    shipToLocationAvailability: { quantity },
    ...(offerId ? { offers: [{ offerId, availableQuantity: quantity }] } : {}),
  };
}

/** One failure per SKU eBay refused, with its own reason. */
function toFailures(responses: readonly BulkResponse[]): InventoryUpdateFailure[] {
  const failures = new Map<string, string>();
  for (const response of responses) {
    if (!response.sku || isSuccessStatus(response.statusCode)) continue;
    const detail = describeEbayErrors(response.errors ?? []);
    failures.set(
      response.sku,
      detail ? `${QUANTITY_REJECTED}${DETAIL_SEPARATOR}${detail}` : QUANTITY_REJECTED,
    );
  }
  return [...failures].map(([externalInventoryId, message]) => ({ externalInventoryId, message }));
}

/**
 * Sets stock on eBay with `bulk_update_price_quantity`, 25 SKUs per call. Each listing variant's
 * `externalInventoryId` is its SKU. The call sets the inventory item's ship-to-home quantity
 * and, for a published offer, the quantity its listing shows. A SKU whose listing shows the
 * quantity already is not written: eBay counts every write as a listing revision (250 a day),
 * and an eBay sale's own stock change comes back here with the quantity eBay already shows.
 */
@Injectable()
export class EbayInventorySync implements InventorySync {
  readonly maxBatchSize = EBAY_BULK_QUANTITY_MAX_SKUS;

  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
    private readonly offers: EbayOfferClient,
  ) {}

  async setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    if (updates.length === 0) return [];
    const account = await ebayAccountContext(session);
    const pending = await this.changedOnly(account, updates);
    const failures: InventoryUpdateFailure[] = [];
    for (const batch of chunk(pending, this.maxBatchSize)) {
      failures.push(...(await this.send(account, batch)));
    }
    return failures;
  }

  /** The SKUs whose listing does not show their quantity yet, with their live offer. */
  private async changedOnly(
    account: EbayAccountContext,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<SkuQuantity[]> {
    const pending: SkuQuantity[] = [];
    for (const update of updates) {
      const sku = update.externalInventoryId;
      const quantity = Math.max(update.available, 0);
      const offer = await this.offers.find(account, sku);
      if (showsAlready(offer, quantity)) continue;
      const published = offer?.status === EbayOfferStatus.Published;
      pending.push({ sku, quantity, offerId: published ? offer.offerId : null });
    }
    return pending;
  }

  private async send(
    account: EbayAccountContext,
    batch: readonly SkuQuantity[],
  ): Promise<InventoryUpdateFailure[]> {
    const { responses } = await this.api.call(
      {
        method: HttpMethod.Post,
        url: new URL(EBAY_BULK_PRICE_QUANTITY_PATH, this.app.hosts().api),
        accessToken: account.accessToken,
        body: { requests: batch.map(toRequest) },
      },
      ebayBulkPriceResponseSchema,
    );
    return toFailures(responses);
  }
}
