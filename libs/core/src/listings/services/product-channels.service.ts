import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ProductChannelView } from '../entities/listing-views.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { pricingContextOf } from '../rules/connection-currency.js';
import { ProductChannelViews } from './product-channel.views.js';
import type { SyncConnection } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';

const PRODUCT_NOT_FOUND = 'Product not found';

/** Where a product stands on each connected channel that can list it, for its editor. */
@Injectable()
export class ProductChannelsService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: SyncProductLoader,
    private readonly listings: ListingSyncRepository,
    private readonly views: ProductChannelViews,
  ) {}

  async list(workspaceId: string, productId: string): Promise<ProductChannelView[]> {
    const product = await this.requireProduct(workspaceId, productId);
    const [connections, listings] = await Promise.all([
      this.connections.list(workspaceId),
      this.listings.listForProduct(workspaceId, productId),
    ]);
    const publishable = connections.filter((connection) => this.canList(connection));
    return Promise.all(
      publishable.map((connection) => {
        const listing = listings.find((entry) => entry.connectionId === connection.id) ?? null;
        return this.views.build(workspaceId, product, this.syncConnection(connection), listing);
      }),
    );
  }

  async get(
    workspaceId: string,
    productId: string,
    connectionId: string,
  ): Promise<ProductChannelView> {
    const product = await this.requireProduct(workspaceId, productId);
    const connection = await this.connections.get(workspaceId, connectionId);
    const listing = await this.listings.findPrimary(workspaceId, connectionId, productId);
    return this.views.build(workspaceId, product, this.syncConnection(connection), listing);
  }

  private async requireProduct(workspaceId: string, productId: string): Promise<ProductDetail> {
    const product = await this.products.find(workspaceId, productId);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    return product;
  }

  private canList(connection: ChannelConnectionView): boolean {
    return connection.status !== ChannelConnectionStatus.DISCONNECTED;
  }

  private syncConnection(view: ChannelConnectionView): Pick<SyncConnection, 'view' | 'pricing'> {
    return { view, pricing: pricingContextOf(view.settings) };
  }
}
