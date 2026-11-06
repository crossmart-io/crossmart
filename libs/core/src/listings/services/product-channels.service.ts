import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ProductChannelView } from '../entities/listing-views.js';
import { LISTING_PRODUCT_NOT_FOUND } from '../listings.constants.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ProductChannelViews } from './product-channel.views.js';
import { SyncProductLoader } from './sync-product.loader.js';

/** One product on one store, as the views of it are built from. */
export interface ProductOnStore {
  product: ProductDetail;
  connection: ChannelConnectionView;
  listing: ListingSyncRecord | null;
}

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
        return this.views.build(workspaceId, product, connection, listing);
      }),
    );
  }

  async get(
    workspaceId: string,
    productId: string,
    connectionId: string,
  ): Promise<ProductChannelView> {
    const { product, connection, listing } = await this.load(workspaceId, productId, connectionId);
    return this.views.build(workspaceId, product, connection, listing);
  }

  /** The product, the store and the product's primary listing there; 404 when either is not found. */
  async load(
    workspaceId: string,
    productId: string,
    connectionId: string,
  ): Promise<ProductOnStore> {
    const product = await this.requireProduct(workspaceId, productId);
    const connection = await this.connections.get(workspaceId, connectionId);
    const listing = await this.listings.findPrimary(workspaceId, connectionId, productId);
    return { product, connection, listing };
  }

  private async requireProduct(workspaceId: string, productId: string): Promise<ProductDetail> {
    const product = await this.products.find(workspaceId, productId);
    if (!product) {
      throw new NotFoundException(LISTING_PRODUCT_NOT_FOUND);
    }
    return product;
  }

  private canList(connection: ChannelConnectionView): boolean {
    return connection.status !== ChannelConnectionStatus.DISCONNECTED;
  }
}
