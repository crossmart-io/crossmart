import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { PriceUpdate } from '../../sdk/capabilities/listing-publisher.js';
import { MercadoLibreItemClient } from './mercadolibre-item.client.js';
import { allVariations, groupByItem, type ItemChanges } from './mercadolibre-item-changes.js';
import { MercadoLibreItemLifecycle } from './mercadolibre-item-lifecycle.js';
import { mercadoLibrePrice } from './mercadolibre-item.mapper.js';
import { requireMercadoLibreSettings } from './mercadolibre-publish-prerequisites.js';

/**
 * Sets prices: an item's own (User Products and single-variant items), or the one price all
 * variations of an item share, the highest of those asked for.
 */
@Injectable()
export class MercadoLibrePriceUpdater {
  constructor(
    private readonly items: MercadoLibreItemClient,
    private readonly lifecycle: MercadoLibreItemLifecycle,
  ) {}

  async update(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    const settings = requireMercadoLibreSettings(session.settings);
    const accessToken = await session.accessToken();
    const changes = updates.map((update) => ({
      key: update.externalVariantId,
      value: mercadoLibrePrice(update.price, settings),
    }));
    for (const group of groupByItem(changes)) {
      await this.write(accessToken, group);
    }
  }

  private async write(accessToken: string, group: ItemChanges<number>): Promise<void> {
    if (group.itemValue !== null && group.variationValues.size === 0) {
      await this.items.update(accessToken, group.itemId, { price: group.itemValue });
      return;
    }
    const price = Math.max(...group.variationValues.values());
    const item = await this.lifecycle.requireOpen(accessToken, group.itemId);
    await this.items.update(accessToken, group.itemId, {
      variations: allVariations(item, () => ({ price })),
    });
  }
}
