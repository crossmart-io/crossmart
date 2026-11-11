import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { ProductSaleRepository } from '../repositories/product-sale.repository.js';
import { ProductSelectionService } from './product-selection.service.js';
import { StoreMembershipService } from './store-membership.service.js';

function removedByHand(store: ChannelConnectionView, productId: string): boolean {
  return store.settings.productSelection?.excludeProductIds.includes(productId) ?? false;
}

/**
 * Takes a sold product off the stores that hold it: each connected store that lists it or whose
 * automatic rule would publish it, unless it was removed from that store by hand already. Each
 * goes through the same path as removing it by hand, so the rule cannot bring it back.
 * Disconnected stores are left out, as Crossmart can no longer reach them.
 */
@Injectable()
export class SoldProductStores {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly sales: ProductSaleRepository,
    private readonly selection: ProductSelectionService,
    private readonly membership: StoreMembershipService,
  ) {}

  /** Returns the stores it was taken off; none when no store held it. */
  async takeOff(
    workspaceId: string,
    productId: string,
    actor: Actor,
  ): Promise<ChannelConnectionView[]> {
    const stores = await this.holding(workspaceId, productId);
    for (const store of stores) {
      await this.membership.remove(
        { workspaceId, connectionId: store.id, productIds: [productId] },
        actor,
      );
    }
    return stores;
  }

  private async holding(workspaceId: string, productId: string): Promise<ChannelConnectionView[]> {
    const [stores, listed] = await Promise.all([
      this.connections.list(workspaceId),
      this.sales.findListedConnectionIds(workspaceId, productId),
    ]);
    const reachable = stores.filter(
      (store) =>
        store.status !== ChannelConnectionStatus.DISCONNECTED && !removedByHand(store, productId),
    );
    const holds = await Promise.all(
      reachable.map(
        async (store) => listed.has(store.id) || this.selects(workspaceId, store, productId),
      ),
    );
    return reachable.filter((_, index) => holds[index]);
  }

  private selects(
    workspaceId: string,
    store: ChannelConnectionView,
    productId: string,
  ): Promise<boolean> {
    const scope = { workspaceId, connectionId: store.id, rule: store.settings.productSelection };
    return this.selection.includes(scope, productId);
  }
}
