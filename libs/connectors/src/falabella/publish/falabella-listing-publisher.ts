import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingReference,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { type FalabellaAccount, falabellaAccount } from '../api/falabella-account.js';
import { FalabellaAction, FalabellaField, FalabellaProductStatus } from '../falabella.enums.js';
import { type FalabellaFeedAction, FalabellaFeedClient } from '../feeds/falabella-feed.client.js';
import { assertFeedApplied } from '../feeds/falabella-feed-outcome.js';
import { FalabellaTaxonomyReader } from '../taxonomy/falabella-taxonomy.reader.js';
import {
  falabellaAttributeValues,
  missingRequiredAttributes,
} from './falabella-attribute-values.js';
import { businessUnitUpdate } from './falabella-business-units.js';
import { falabellaImageUrls, imageRequest } from './falabella-images.js';
import {
  type FalabellaProductPlan,
  listingStatus,
  parentSkuOf,
  skuOf,
  toFalabellaProducts,
} from './falabella-product.mapper.js';
import { FalabellaProductLookup } from './falabella-product-lookup.js';
import { assignFalabellaSkus } from './falabella-skus.js';

const NO_CATEGORY = 'Choose a Falabella category for this product.';
const MISSING_PREFIX = 'Falabella requires these item specifics in this category: ';
const MISSING_SUFFIX = '. Add them in the listing’s item specifics.';
const LIST_SEPARATOR = ', ';

/**
 * Publishes a product as one Falabella product per variant, grouped under a parent SKU where
 * the category groups variations, then sends its images. A product whose SKUs Falabella holds
 * already is updated, so a publish that is run again never creates it twice. Ending a listing
 * sets its products inactive; Crossmart never removes Falabella products.
 */
@Injectable()
export class FalabellaListingPublisher {
  constructor(
    private readonly taxonomy: FalabellaTaxonomyReader,
    private readonly feeds: FalabellaFeedClient,
    private readonly lookup: FalabellaProductLookup,
  ) {}

  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    return this.write(session, draft, false);
  }

  update(
    session: ChannelSession,
    _externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    return this.write(session, draft, true);
  }

  async delist(
    session: ChannelSession,
    externalId: string,
    reference?: ListingReference,
  ): Promise<void> {
    const account = await falabellaAccount(session);
    const skus = reference?.variantExternalIds.length ? reference.variantExternalIds : [externalId];
    const products = skus.map((sellerSku) =>
      businessUnitUpdate(account.country, sellerSku, {
        [FalabellaField.Status]: FalabellaProductStatus.Inactive,
      }),
    );
    const result = await this.feeds.run(account, FalabellaAction.ProductUpdate, {
      [FalabellaField.Product]: products,
    });
    assertFeedApplied(result);
  }

  private async write(
    session: ChannelSession,
    draft: ListingDraft,
    listed: boolean,
  ): Promise<PublishedListing> {
    const account = await falabellaAccount(session);
    const plan = await this.plan(account, draft);
    const action = listed
      ? FalabellaAction.ProductUpdate
      : await this.createOrUpdate(account, plan);
    const products = { [FalabellaField.Product]: toFalabellaProducts(plan) };
    assertFeedApplied(await this.feeds.run(account, action, products));
    if (this.sendsImages(draft, action)) {
      const skus = draft.variants.map((variant) => skuOf(plan, variant));
      assertFeedApplied(
        await this.feeds.run(account, FalabellaAction.Image, imageRequest(draft, skus)),
      );
    }
    return this.published(plan);
  }

  private async plan(
    account: FalabellaAccount,
    draft: ListingDraft,
  ): Promise<FalabellaProductPlan> {
    const category = await this.category(account, draft);
    const attributes = await this.taxonomy.attributes(account, category.id);
    const values = falabellaAttributeValues(draft, attributes);
    const missing = missingRequiredAttributes(draft, attributes, values);
    if (missing.length > 0) {
      throw ChannelError.unmet(ChannelType.Falabella, {
        requirement: PublishRequirement.ItemSpecifics,
        reason: `${MISSING_PREFIX}${missing.join(LIST_SEPARATOR)}${MISSING_SUFFIX}`,
      });
    }
    const skus = assignFalabellaSkus(draft.variants);
    return { draft, country: account.country, category, attributes, values, skus };
  }

  /** The listing's category, or Falabella's best one for its title, which Crossmart stores. */
  private async category(account: FalabellaAccount, draft: ListingDraft): Promise<ChannelCategory> {
    if (draft.category) return draft.category;
    const [best] = await this.taxonomy.suggest(account, draft.product.title);
    if (!best) {
      throw ChannelError.unmet(ChannelType.Falabella, {
        requirement: PublishRequirement.Category,
        reason: NO_CATEGORY,
      });
    }
    return best;
  }

  /** Creates the products, unless an earlier publish that did not finish created them. */
  private async createOrUpdate(
    account: FalabellaAccount,
    plan: FalabellaProductPlan,
  ): Promise<FalabellaFeedAction> {
    const skus = plan.draft.variants.map((variant) => skuOf(plan, variant));
    const existing = await this.lookup.find(account, skus);
    return existing.size > 0 ? FalabellaAction.ProductUpdate : FalabellaAction.ProductCreate;
  }

  /** Images go on create, and on update when they changed; Falabella downloads each again. */
  private sendsImages(draft: ListingDraft, action: FalabellaFeedAction): boolean {
    const hasImages = falabellaImageUrls(draft.product.images.map((image) => image.url)).length > 0;
    const changed = action === FalabellaAction.ProductCreate || draft.imagesChanged !== false;
    return hasImages && changed;
  }

  /** The parent SKU names the listing; each variant is the product with its own SKU. */
  private published(plan: FalabellaProductPlan): PublishedListing {
    const variants = plan.draft.variants.map((variant) => {
      const sellerSku = skuOf(plan, variant);
      return {
        variantId: variant.variantId,
        externalId: sellerSku,
        externalInventoryId: sellerSku,
      };
    });
    return {
      externalId: parentSkuOf(plan) ?? variants[0]?.externalId ?? plan.draft.productId,
      externalUrl: null,
      active: listingStatus(plan.draft) === FalabellaProductStatus.Active,
      variants,
      category: plan.category,
    };
  }
}
