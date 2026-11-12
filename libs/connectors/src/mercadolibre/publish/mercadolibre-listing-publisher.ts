import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingPublisher,
  ListingReference,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import type { MercadoLibreSettings } from '../mercadolibre-settings.js';
import { MercadoLibreCategoryReader } from '../taxonomy/mercadolibre-category.reader.js';
import { MercadoLibreCategoryAttributesReader } from '../taxonomy/mercadolibre-category-attributes.reader.js';
import {
  MercadoLibreAttributeIndex,
  missingRequiredAttributes,
} from './mercadolibre-attributes.js';
import { MercadoLibreItemLifecycle } from './mercadolibre-item-lifecycle.js';
import { listingPictures } from './mercadolibre-item.mapper.js';
import { hasVariationKeys, parseVariantKey } from './mercadolibre-keys.js';
import type {
  MercadoLibreListingOutcome,
  MercadoLibreListingPlan,
  MercadoLibreListingWriter,
} from './mercadolibre-listing-plan.js';
import {
  MERCADOLIBRE_NO_CATEGORY,
  MERCADOLIBRE_NO_IMAGES,
  missingAttributesRequirement,
  requireMercadoLibreSettings,
} from './mercadolibre-publish-prerequisites.js';
import { MercadoLibreListingWriters } from './mercadolibre-listing-writers.js';

/**
 * Lists products on Mercado Libre, in the item model the seller's account uses: User Products
 * (an item per variant) when the account has the `user_product_seller` tag, else one item with
 * variations. A listing published as variations stays so. Ending a listing closes its items.
 */
@Injectable()
export class MercadoLibreListingPublisher implements Omit<ListingPublisher, 'updatePrices'> {
  constructor(
    private readonly categories: MercadoLibreCategoryReader,
    private readonly attributes: MercadoLibreCategoryAttributesReader,
    private readonly writers: MercadoLibreListingWriters,
    private readonly lifecycle: MercadoLibreItemLifecycle,
  ) {}

  async publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    const plan = await this.plan(session, draft);
    return toPublished(plan, await this.writerFor(plan).publish(plan));
  }

  async update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    const plan = await this.plan(session, draft);
    return toPublished(plan, await this.writerFor(plan).update(plan, externalId));
  }

  /** Closes the listing's items: its own, and each variant's under User Products. */
  async delist(
    session: ChannelSession,
    externalId: string,
    reference?: ListingReference,
  ): Promise<void> {
    const variantItems = (reference?.variantExternalIds ?? []).flatMap((key) => {
      const itemId = parseVariantKey(key)?.itemId;
      return itemId ? [itemId] : [];
    });
    const itemIds = [...new Set([externalId, ...variantItems])];
    await this.lifecycle.close(await session.accessToken(), itemIds);
  }

  /** Checks settings, pictures, category and required attributes before the first write. */
  private async plan(
    session: ChannelSession,
    draft: ListingDraft,
  ): Promise<MercadoLibreListingPlan> {
    const settings = requireMercadoLibreSettings(draft.accountSettings ?? session.settings);
    if (listingPictures(draft).length === 0) {
      throw ChannelError.unmet(ChannelType.MercadoLibre, MERCADOLIBRE_NO_IMAGES);
    }
    const accessToken = await session.accessToken();
    const category = await this.categoryOf(accessToken, settings, draft);
    const categoryAttributes = await this.attributes.read(accessToken, category.id);
    const index = new MercadoLibreAttributeIndex(categoryAttributes, settings.userProductSeller);
    const missing = missingRequiredAttributes(draft, index);
    if (missing.length > 0) {
      throw ChannelError.unmet(ChannelType.MercadoLibre, missingAttributesRequirement(missing));
    }
    return { accessToken, draft, settings, category, attributes: index };
  }

  /** The listing's category, or Mercado Libre's best prediction for its title. */
  private async categoryOf(
    accessToken: string,
    settings: MercadoLibreSettings,
    draft: ListingDraft,
  ): Promise<ChannelCategory> {
    if (draft.category) return draft.category;
    const [best] = await this.categories.suggest(accessToken, settings.siteId, draft.product.title);
    if (!best) {
      throw ChannelError.unmet(ChannelType.MercadoLibre, MERCADOLIBRE_NO_CATEGORY);
    }
    return best;
  }

  private writerFor(plan: MercadoLibreListingPlan): MercadoLibreListingWriter {
    const published = plan.draft.variants.map((variant) => variant.externalVariantId);
    if (hasVariationKeys(published)) return this.writers.singleItem;
    return plan.settings.userProductSeller ? this.writers.userProduct : this.writers.singleItem;
  }
}

function toPublished(
  plan: MercadoLibreListingPlan,
  outcome: MercadoLibreListingOutcome,
): PublishedListing {
  return {
    externalId: outcome.itemId,
    externalUrl: outcome.url,
    active: outcome.active,
    variants: outcome.variants.map(({ variantId, key }) => ({
      variantId,
      externalId: key,
      externalInventoryId: key,
    })),
    category: plan.category,
  };
}
