import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  InventoryQuantityUpdate,
  InventoryUpdateFailure,
} from '../../sdk/capabilities/inventory-sync.js';
import { falabellaAccount } from '../api/falabella-account.js';
import { FALABELLA_FEED_BATCH_SIZE } from '../falabella.constants.js';
import { FalabellaAction, FalabellaFeedStatus, FalabellaField } from '../falabella.enums.js';
import { FalabellaFeedClient } from '../feeds/falabella-feed.client.js';
import { assertFeedApplied } from '../feeds/falabella-feed-outcome.js';
import type { FalabellaFeedResult } from '../feeds/falabella-feed.types.js';
import { businessUnitUpdate } from '../publish/falabella-business-units.js';
import { FalabellaProductLookup } from '../publish/falabella-product-lookup.js';

/**
 * Sets each SKU's stock in the connection's country with `ProductUpdate`, a batch per feed,
 * which writes the seller's default warehouse. Rows Falabella refuses are reported by SKU; a
 * feed that failed as a whole fails the batch. Stock is read back with `GetProducts`, which is
 * not a feed, so a reconciliation spends no feed on what did not drift.
 */
@Injectable()
export class FalabellaInventorySync {
  readonly maxBatchSize = FALABELLA_FEED_BATCH_SIZE;

  constructor(
    private readonly feeds: FalabellaFeedClient,
    private readonly lookup: FalabellaProductLookup,
  ) {}

  async setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    if (updates.length === 0) return [];
    const account = await falabellaAccount(session);
    const products = updates.map((update) =>
      businessUnitUpdate(account.country, update.externalInventoryId, {
        [FalabellaField.Stock]: Math.max(update.available, 0),
      }),
    );
    const result = await this.feeds.run(account, FalabellaAction.ProductUpdate, {
      [FalabellaField.Product]: products,
    });
    return this.failures(result);
  }

  async readQuantities(
    session: ChannelSession,
    externalInventoryIds: readonly string[],
  ): Promise<Map<string, number>> {
    const account = await falabellaAccount(session);
    const listed = await this.lookup.find(account, externalInventoryIds);
    const quantities = new Map<string, number>();
    for (const product of listed.values()) {
      if (product.stock !== null) quantities.set(product.sellerSku, product.stock);
    }
    return quantities;
  }

  /** Row errors that name a SKU fail that SKU; a feed that failed otherwise throws. */
  private failures(result: FalabellaFeedResult): InventoryUpdateFailure[] {
    const bySku = result.errors.filter((error) => error.sellerSku !== null);
    if (bySku.length === 0 || result.status === FalabellaFeedStatus.Canceled) {
      assertFeedApplied(result);
    }
    return bySku.map((error) => ({
      externalInventoryId: error.sellerSku ?? '',
      message: error.message,
    }));
  }
}
