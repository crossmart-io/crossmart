import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { sanitizeDescriptionHtml } from '@crossmart/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type {
  ListingContentPatch,
  ListingOverrideInput,
  ListingOverridePatch,
} from '../entities/listing-override.js';
import { applyOverridePatch } from '../rules/listing-override-patch.js';
import { type OverrideTarget, ListingOverrideWriter } from './listing-override.writer.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';

const PRODUCT_NOT_FOUND = 'Product not found';
const FOREIGN_VARIANT = 'A price is set for a variant this product does not have';
const FOREIGN_IMAGE = 'Only the product’s own images can be shown on a channel';
const DUPLICATE_VARIANT = 'Each variant can have one price per channel';

/**
 * Per-channel overrides of one product (ChannelContent): content, images, visibility, prices
 * and stock limits. They are validated against the product, so a listing only ever shows the
 * product's own variants and images, and the description is sanitized like the product's, so
 * the API, MCP and approved suggestions can never store scripts or event handlers.
 */
@Injectable()
export class ListingOverridesService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly products: SyncProductLoader,
    private readonly writer: ListingOverrideWriter,
    private readonly activity: ActivityRecorder,
  ) {}

  async save(target: OverrideTarget, input: ListingOverrideInput, actor: Actor): Promise<void> {
    const product = await this.requireProduct(target);
    this.assertBelongsToProduct(product, input);
    const connection = await this.connections.require(target.workspaceId, target.connectionId);
    await this.writer.save(target, ListingOverridesService.sanitized(input));
    await this.record(target, actor, product, connection.view.displayName);
  }

  private static sanitized(input: ListingOverrideInput): ListingOverrideInput {
    if (input.descriptionHtml === null) return input;
    return { ...input, descriptionHtml: sanitizeDescriptionHtml(input.descriptionHtml) };
  }

  /**
   * Changes some content fields of the listing and keeps every other override, as an approved
   * suggestion does. Saved, validated, synced and logged like any other override.
   */
  saveContent(target: OverrideTarget, patch: ListingContentPatch, actor: Actor): Promise<void> {
    return this.patch(target, patch, actor);
  }

  /**
   * Changes some overrides and keeps the rest: absent fields keep their override, null ones
   * revert to the product's value (variant prices merge per variant). Saved, validated, synced
   * and logged like a full save.
   */
  async patch(target: OverrideTarget, patch: ListingOverridePatch, actor: Actor): Promise<void> {
    const current = await this.writer.current(target);
    await this.save(target, applyOverridePatch(current, patch), actor);
  }

  async clear(target: OverrideTarget, actor: Actor): Promise<void> {
    const product = await this.requireProduct(target);
    const connection = await this.connections.require(target.workspaceId, target.connectionId);
    await this.writer.clear(target);
    await this.record(target, actor, product, connection.view.displayName);
  }

  private async requireProduct(target: OverrideTarget): Promise<ProductDetail> {
    const product = await this.products.find(target.workspaceId, target.productId);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND);
    }
    return product;
  }

  private assertBelongsToProduct(product: ProductDetail, input: ListingOverrideInput): void {
    const variantIds = new Set(product.variants.map((variant) => variant.id));
    const pricedIds = input.variantPrices.map((entry) => entry.variantId);
    if (pricedIds.some((variantId) => !variantIds.has(variantId))) {
      throw new BadRequestException(FOREIGN_VARIANT);
    }
    if (new Set(pricedIds).size !== pricedIds.length) {
      throw new BadRequestException(DUPLICATE_VARIANT);
    }
    const imageUrls = new Set(product.media.map((media) => media.url));
    if (input.mediaUrls?.some((url) => !imageUrls.has(url))) {
      throw new BadRequestException(FOREIGN_IMAGE);
    }
  }

  private record(
    target: OverrideTarget,
    actor: Actor,
    product: ProductDetail,
    storeName: string,
  ): Promise<void> {
    return this.activity.record(target.workspaceId, actor, {
      action: ActivityAction.ListingOverrideUpdated,
      subject: { type: ActivitySubjectType.Product, id: product.id, label: product.title },
      detail: storeName,
    });
  }
}
