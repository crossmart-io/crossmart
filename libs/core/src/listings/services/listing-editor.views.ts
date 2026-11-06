import { Injectable } from '@nestjs/common';
import {
  ChannelCapability,
  ChannelConnectorRegistry,
  supportsCapability,
} from '@crossmart/connectors';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ListingEditorView } from '../entities/listing-editor.js';
import { toListingEditorView } from '../mappers/listing-editor.mapper.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { ProductChannelViews } from './product-channel.views.js';

/**
 * Builds the listing editor's view of one product on one store: the store view (display state,
 * prices, stock), with each field split into the product's value, the override and the result.
 */
@Injectable()
export class ListingEditorViews {
  constructor(
    private readonly channelViews: ProductChannelViews,
    private readonly registry: ChannelConnectorRegistry,
  ) {}

  async build(
    workspaceId: string,
    product: ProductDetail,
    connection: ChannelConnectionView,
    listing: ListingSyncRecord | null,
  ): Promise<ListingEditorView> {
    const channel = await this.channelViews.build(workspaceId, product, connection, listing);
    return toListingEditorView({
      channel,
      product,
      listing,
      hasTaxonomy: this.hasTaxonomy(connection),
    });
  }

  private hasTaxonomy(connection: ChannelConnectionView): boolean {
    const connector = this.registry.require(connection.channel);
    return supportsCapability(connector, ChannelCapability.ProvideTaxonomy);
  }
}
