import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type CategoryAspect,
  type ChannelCategory,
  ChannelCapability,
  type ChannelConnector,
  type ItemSpecific,
  supportsCapability,
  type TaxonomyProvider,
} from '@crossmart/connectors';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { callChannel } from '../../channels/rules/channel-http-error.js';
import type { ListingItemSpecificsView } from '../entities/listing-item-specifics.js';
import { normalizeItemSpecifics, repeatedItemSpecificNames } from '../rules/item-specifics.js';
import { ListingItemSpecificsWriter } from './listing-item-specifics.writer.js';
import type { OverrideTarget } from './listing-override.writer.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';

const PRODUCT_NOT_FOUND = 'Product not found';
const NO_ITEM_SPECIFICS = 'This channel has no item specifics to set';
const REPEATED_NAMES = 'Set each item specific once: ';
const NAME_SEPARATOR = ', ';

/**
 * The item specifics of a listing, on channels whose categories have them (eBay): the ones the
 * listing's category asks for, read from the channel's taxonomy, and the values the merchant
 * set, which are sent on publish ahead of the ones Crossmart derives.
 */
@Injectable()
export class ListingItemSpecificsService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly products: SyncProductLoader,
    private readonly writer: ListingItemSpecificsWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  async get(target: OverrideTarget): Promise<ListingItemSpecificsView> {
    await this.requireProduct(target);
    const connector = await this.requireTaxonomy(target);
    const { category, values } = await this.writer.current(target);
    const aspects = category ? await this.categoryAspects(target, connector, category) : [];
    return { category, aspects, values };
  }

  /** Replaces the listing's item specifics; values left blank remove a specific. */
  async save(target: OverrideTarget, specifics: ItemSpecific[], actor: Actor): Promise<void> {
    const product = await this.requireProduct(target);
    await this.requireTaxonomy(target);
    const normalized = normalizeItemSpecifics(specifics);
    const repeated = repeatedItemSpecificNames(normalized);
    if (repeated.length > 0) {
      throw new BadRequestException(`${REPEATED_NAMES}${repeated.join(NAME_SEPARATOR)}`);
    }
    await this.writer.save(target, normalized);
    await this.record(target, product, actor);
  }

  private async categoryAspects(
    target: OverrideTarget,
    connector: TaxonomyProvider,
    category: ChannelCategory,
  ): Promise<CategoryAspect[]> {
    const session = await this.connections.openSession(target.workspaceId, target.connectionId);
    return callChannel(() => connector.categoryAspects(session, category.id));
  }

  private async record(
    target: OverrideTarget,
    product: ProductDetail,
    actor: Actor,
  ): Promise<void> {
    const connection = await this.connections.require(target.workspaceId, target.connectionId);
    await this.activity.record(target.workspaceId, actor, {
      action: ActivityAction.ListingItemSpecificsChanged,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
      detail: connection.view.displayName,
    });
  }

  private async requireTaxonomy(
    target: OverrideTarget,
  ): Promise<ChannelConnector & TaxonomyProvider> {
    const { connector } = await this.connections.require(target.workspaceId, target.connectionId);
    if (!supportsCapability(connector, ChannelCapability.ProvideTaxonomy)) {
      throw new BadRequestException(NO_ITEM_SPECIFICS);
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
