import { Injectable } from '@nestjs/common';
import { FixedDecimal } from '@crossmart/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { PriceUpdate } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { etsyShopContext } from '../api/etsy-shop-context.js';
import { etsyError } from '../etsy-errors.js';
import { InventoryEditOutcome } from './etsy-inventory-edit.js';
import { EtsyInventoryClient } from './etsy-inventory.client.js';

const SKU_MISSING = 'The Etsy listing has no variant with SKU';

function byListing(updates: readonly PriceUpdate[]): Map<string, PriceUpdate[]> {
  const grouped = new Map<string, PriceUpdate[]>();
  for (const update of updates) {
    grouped.set(update.externalProductId, [
      ...(grouped.get(update.externalProductId) ?? []),
      update,
    ]);
  }
  return grouped;
}

/**
 * Changes prices on Etsy through each listing's inventory: read, set each SKU's offering
 * price, and write back when one differs. Compare-at prices are not sent: Etsy has no field
 * for them (sales are set up as Etsy promotions).
 */
@Injectable()
export class EtsyPriceUpdater {
  constructor(private readonly inventory: EtsyInventoryClient) {}

  async update(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    if (updates.length === 0) return;
    const shop = await etsyShopContext(session);
    for (const [listingId, listingUpdates] of byListing(updates)) {
      const missing = await this.inventory.modify(shop, listingId, (edit) =>
        listingUpdates.filter(
          ({ externalVariantId, price }) =>
            edit.setPrice(externalVariantId, FixedDecimal.of(price)) ===
            InventoryEditOutcome.Missing,
        ),
      );
      const [first] = missing;
      if (first) {
        throw etsyError(
          ChannelErrorCode.RequestRejected,
          `${SKU_MISSING} ${first.externalVariantId}`,
        );
      }
    }
  }
}
