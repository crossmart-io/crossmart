import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  InventoryQuantityUpdate,
  InventoryUpdateFailure,
} from '../../sdk/capabilities/inventory-sync.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { MercadoLibreItemClient } from '../publish/mercadolibre-item.client.js';
import {
  allVariations,
  groupByItem,
  type ItemChanges,
} from '../publish/mercadolibre-item-changes.js';
import { MercadoLibreItemLifecycle } from '../publish/mercadolibre-item-lifecycle.js';
import { formatVariantKey } from '../publish/mercadolibre-keys.js';

/**
 * Sets available quantities (Products sync guide): `available_quantity` on an item, or on its
 * variations, read first so none is left out. An item set to 0 is paused by Mercado Libre and
 * comes back when restocked. One failed item does not fail the others.
 */
@Injectable()
export class MercadoLibreInventorySync {
  constructor(
    private readonly items: MercadoLibreItemClient,
    private readonly lifecycle: MercadoLibreItemLifecycle,
  ) {}

  async setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    const accessToken = await session.accessToken();
    const changes = updates.map((update) => ({
      key: update.externalInventoryId,
      value: Math.max(update.available, 0),
    }));
    const failures: InventoryUpdateFailure[] = [];
    for (const group of groupByItem(changes)) {
      try {
        await this.write(accessToken, group);
      } catch (error) {
        if (!(error instanceof ChannelError) || error.retryable) throw error;
        failures.push(...failuresOf(group, error.message));
      }
    }
    return failures;
  }

  private async write(accessToken: string, group: ItemChanges<number>): Promise<void> {
    if (group.variationValues.size === 0) {
      await this.items.update(accessToken, group.itemId, {
        available_quantity: group.itemValue ?? 0,
      });
      return;
    }
    const item = await this.lifecycle.requireOpen(accessToken, group.itemId);
    await this.items.update(accessToken, group.itemId, {
      variations: allVariations(item, (variationId) => {
        const quantity = group.variationValues.get(variationId);
        return quantity === undefined ? {} : { available_quantity: quantity };
      }),
    });
  }
}

function failuresOf(group: ItemChanges<number>, message: string): InventoryUpdateFailure[] {
  const variationIds: (number | null)[] = [...group.variationValues.keys()];
  const ids = group.itemValue === null ? variationIds : [null, ...variationIds];
  return ids.map((variationId) => ({
    externalInventoryId: formatVariantKey({ itemId: group.itemId, variationId }),
    message,
  }));
}
