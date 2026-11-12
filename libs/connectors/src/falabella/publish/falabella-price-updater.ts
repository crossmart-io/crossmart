import { Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { PriceUpdate } from '../../sdk/capabilities/listing-publisher.js';
import { falabellaAccount } from '../api/falabella-account.js';
import { FALABELLA_FEED_BATCH_SIZE } from '../falabella.constants.js';
import { FalabellaAction, FalabellaField } from '../falabella.enums.js';
import { FalabellaFeedClient } from '../feeds/falabella-feed.client.js';
import { assertFeedApplied } from '../feeds/falabella-feed-outcome.js';
import { businessUnitUpdate } from './falabella-business-units.js';
import { falabellaPrice } from './falabella-values.js';

/**
 * Sets the price buyers pay as each SKU's `Price`, one feed per batch. Compare-at prices are
 * not sent: a Falabella sale price (`SpecialPrice`) needs start and end dates Crossmart does
 * not have.
 */
@Injectable()
export class FalabellaPriceUpdater {
  constructor(private readonly feeds: FalabellaFeedClient) {}

  async update(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    const account = await falabellaAccount(session);
    for (const batch of chunk(updates, FALABELLA_FEED_BATCH_SIZE)) {
      const products = batch.map((update) =>
        businessUnitUpdate(account.country, update.externalVariantId, {
          [FalabellaField.Price]: falabellaPrice(update.price),
        }),
      );
      const result = await this.feeds.run(account, FalabellaAction.ProductUpdate, {
        [FalabellaField.Product]: products,
      });
      assertFeedApplied(result);
    }
  }
}
