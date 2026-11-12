import { Injectable } from '@nestjs/common';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { MercadoLibreItemStatus } from '../mercadolibre.enums.js';
import { mercadoLibreError } from '../mercadolibre-errors.js';
import { MercadoLibreItemClient } from './mercadolibre-item.client.js';
import type { MercadoLibreItem } from './mercadolibre-item.types.js';

export const LISTING_GONE =
  'This listing was closed or removed on Mercado Libre. Remove it here and publish it again.';

/**
 * An item's status as the product wants it: an active product's paused item is activated when
 * it has stock (one without is paused by Mercado Libre until restocked), and an inactive
 * product's active item is paused. Closing is final: a closed item cannot be reactivated.
 */
@Injectable()
export class MercadoLibreItemLifecycle {
  constructor(private readonly items: MercadoLibreItemClient) {}

  /** The item to update, refusing one Mercado Libre closed or no longer has. */
  async requireOpen(accessToken: string, itemId: string): Promise<MercadoLibreItem> {
    const item = await this.items.find(accessToken, itemId);
    if (!item || item.status === MercadoLibreItemStatus.Closed) {
      throw mercadoLibreError(ChannelErrorCode.RequestRejected, LISTING_GONE);
    }
    return item;
  }

  /** Sets the status the product wants; answers whether the item is active. */
  async applyStatus(
    accessToken: string,
    item: MercadoLibreItem,
    wantsActive: boolean,
    quantity: number,
  ): Promise<boolean> {
    const target = targetStatus(item.status, wantsActive, quantity);
    if (!target) return item.status === MercadoLibreItemStatus.Active;
    const updated = await this.items.setStatus(accessToken, item.id, target);
    return updated.status === MercadoLibreItemStatus.Active;
  }

  /** Closes each open item; ones already closed or gone are left as they are. */
  async close(accessToken: string, itemIds: readonly string[]): Promise<void> {
    for (const itemId of itemIds) {
      const item = await this.items.find(accessToken, itemId);
      if (item && item.status !== MercadoLibreItemStatus.Closed) {
        await this.items.setStatus(accessToken, itemId, MercadoLibreItemStatus.Closed);
      }
    }
  }
}

/** The status to set, or null to leave the item as it is. */
function targetStatus(
  current: string,
  wantsActive: boolean,
  quantity: number,
): MercadoLibreItemStatus | null {
  if (wantsActive) {
    return current === MercadoLibreItemStatus.Paused && quantity > 0
      ? MercadoLibreItemStatus.Active
      : null;
  }
  return current === MercadoLibreItemStatus.Active ? MercadoLibreItemStatus.Paused : null;
}
