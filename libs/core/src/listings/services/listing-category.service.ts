import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type ChannelCategory,
  ChannelCapability,
  type ChannelConnector,
  supportsCapability,
  type TaxonomyProvider,
} from '@crossmart/connectors';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { callChannel } from '../../channels/rules/channel-http-error.js';
import { ListingCategoryWriter } from './listing-category.writer.js';
import type { OverrideTarget } from './listing-override.writer.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';

const PRODUCT_NOT_FOUND = 'Product not found';
const NO_TAXONOMY = 'This channel has no categories to choose from';

/**
 * The channel category a product is listed in, on channels that have them (eBay). Suggestions
 * come from the channel's taxonomy; the choice is kept on the listing, so updates stay in it.
 */
@Injectable()
export class ListingCategoryService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly products: SyncProductLoader,
    private readonly writer: ListingCategoryWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Categories that fit `query`, or the product's title when it is blank. */
  async suggest(target: OverrideTarget, query?: string): Promise<ChannelCategory[]> {
    const product = await this.requireProduct(target);
    const connector = await this.requireTaxonomy(target);
    const session = await this.connections.openSession(target.workspaceId, target.connectionId);
    const keywords = query?.trim() || product.title;
    return callChannel(() => connector.suggestCategories(session, keywords));
  }

  /** Lists the product in `category`; null lets its next publish pick eBay's best match. */
  async choose(
    target: OverrideTarget,
    category: ChannelCategory | null,
    actor: Actor,
  ): Promise<void> {
    const product = await this.requireProduct(target);
    await this.requireTaxonomy(target);
    await this.writer.save(target, category);
    const connection = await this.connections.require(target.workspaceId, target.connectionId);
    await this.activity.record(target.workspaceId, actor, {
      action: ActivityAction.ListingCategoryChanged,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
      detail: connection.view.displayName,
    });
  }

  private async requireTaxonomy(
    target: OverrideTarget,
  ): Promise<ChannelConnector & TaxonomyProvider> {
    const { connector } = await this.connections.require(target.workspaceId, target.connectionId);
    if (!supportsCapability(connector, ChannelCapability.ProvideTaxonomy)) {
      throw new BadRequestException(NO_TAXONOMY);
    }
    return connector;
  }

  private async requireProduct(target: OverrideTarget): Promise<ProductDetail> {
    const product = await this.products.find(target.workspaceId, target.productId);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    return product;
  }
}
