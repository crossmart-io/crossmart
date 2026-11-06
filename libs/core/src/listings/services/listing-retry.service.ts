import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingRetryTarget } from '../entities/listing-retry.js';
import {
  LISTING_PRODUCT_NOT_FOUND,
  RETRY_NEEDS_CONNECTION,
  RETRY_NEEDS_SELECTION,
} from '../listings.constants.js';
import { ListingRequeuer } from './listing-requeuer.js';
import { ProductSelectionService } from './product-selection.service.js';
import { SyncProductLoader } from './sync-product.loader.js';

/**
 * "Retry" on one product in one store: publishes it there again, without resyncing the whole
 * store. The store must be connected and must select the product, else it answers 409.
 */
@Injectable()
export class ListingRetryService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: SyncProductLoader,
    private readonly selection: ProductSelectionService,
    private readonly requeuer: ListingRequeuer,
  ) {}

  async retry(target: ListingRetryTarget, actor: Actor): Promise<void> {
    const connection = await this.requireConnected(target);
    const product = await this.requireProduct(target);
    await this.assertSelected(target, connection);
    await this.requeuer.requeue(
      { ...target, productTitle: product.title, storeName: connection.displayName },
      actor,
    );
  }

  private async requireConnected(target: ListingRetryTarget): Promise<ChannelConnectionView> {
    const connection = await this.connections.get(target.workspaceId, target.connectionId);
    if (connection.status !== ChannelConnectionStatus.CONNECTED) {
      throw new ConflictException(RETRY_NEEDS_CONNECTION);
    }
    return connection;
  }

  private async requireProduct(target: ListingRetryTarget): Promise<ProductDetail> {
    const product = await this.products.find(target.workspaceId, target.productId);
    if (!product) {
      throw new NotFoundException(LISTING_PRODUCT_NOT_FOUND);
    }
    return product;
  }

  private async assertSelected(
    { workspaceId, productId }: ListingRetryTarget,
    connection: ChannelConnectionView,
  ): Promise<void> {
    const rule = connection.settings.productSelection;
    const selected = await this.selection.includes(
      { workspaceId, connectionId: connection.id, rule },
      productId,
    );
    if (!selected) {
      throw new ConflictException(RETRY_NEEDS_SELECTION);
    }
  }
}
