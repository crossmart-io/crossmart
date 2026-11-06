import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingPublisher,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { type EtsyShopContext, etsyShopContext } from '../api/etsy-shop-context.js';
import { ETSY_LISTING_URL_PREFIX } from '../etsy.constants.js';
import { EtsyListingState } from '../etsy.enums.js';
import { etsyError } from '../etsy-errors.js';
import { EtsyTaxonomyReader } from '../taxonomy/etsy-taxonomy.reader.js';
import { EtsyInventoryClient } from './etsy-inventory.client.js';
import { toInventoryInput } from './etsy-inventory.mapper.js';
import { formatInventoryId, assignEtsySkus } from './etsy-keys.js';
import { EtsyListingClient } from './etsy-listing.client.js';
import {
  draftFields,
  type EtsyListingTerms,
  listingFields,
  stateField,
} from './etsy-listing.mapper.js';
import { EtsyListingImages, listingImages } from './etsy-listing-images.js';
import {
  ETSY_NO_IMAGES,
  ETSY_UNNAMED_OPTIONS,
  hasListableOptions,
  requireListingSetup,
} from './etsy-publish-prerequisites.js';

export const LISTING_GONE =
  'This listing no longer exists on Etsy. Remove it and publish it again.';
const NO_CATEGORY = {
  requirement: PublishRequirement.Category,
  reason: 'Choose an Etsy category for this listing: none matched its title.',
};
/** States Crossmart publishes a listing from; a sold-out one renews (and is charged) on Etsy only. */
const ACTIVATABLE: ReadonlySet<string> = new Set([
  EtsyListingState.Draft,
  EtsyListingState.Inactive,
  EtsyListingState.Expired,
]);

/** Everything one listing write needs, resolved before the first call to Etsy. */
interface ListingPlan {
  shop: EtsyShopContext;
  draft: ListingDraft;
  terms: EtsyListingTerms;
  category: ChannelCategory;
  skus: Map<string, string>;
}

/** Where the listing ends up after a write. */
interface ListingOutcome {
  listingId: string;
  url: string | null | undefined;
  active: boolean;
}

/**
 * Lists products on Etsy: a draft listing (`createDraftListing`) with the connection's item
 * details and profiles, its images uploaded, and its inventory (one product per variant, keyed
 * by SKU) written with `updateListingInventory`; then it is made active. Updates edit the
 * listing in place. Ending a listing deactivates it, so it can be published again.
 */
@Injectable()
export class EtsyListingPublisher implements Omit<ListingPublisher, 'updatePrices'> {
  constructor(
    private readonly listings: EtsyListingClient,
    private readonly inventory: EtsyInventoryClient,
    private readonly images: EtsyListingImages,
    private readonly taxonomy: EtsyTaxonomyReader,
  ) {}

  async publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    const plan = await this.plan(session, draft);
    const created = await this.listings.createDraft(plan.shop, draftFields(draft, plan.terms));
    const listingId = String(created.listing_id);
    await this.writeContent(plan, listingId, true);
    const active = await this.applyState(plan, listingId, created.state);
    return this.toPublished(plan, { listingId, url: created.url, active });
  }

  async update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    const plan = await this.plan(session, draft);
    const current = await this.listings.find(plan.shop, externalId);
    if (!current) {
      throw etsyError(ChannelErrorCode.RequestRejected, LISTING_GONE);
    }
    await this.listings.update(plan.shop, externalId, listingFields(draft, plan.terms));
    await this.writeContent(plan, externalId, draft.imagesChanged !== false);
    const active = await this.applyState(plan, externalId, current.state);
    return this.toPublished(plan, { listingId: externalId, url: current.url, active });
  }

  /** Deactivates an active listing; Etsy keeps it, and publishing again reactivates it. */
  async delist(session: ChannelSession, externalId: string): Promise<void> {
    const shop = await etsyShopContext(session);
    const current = await this.listings.find(shop, externalId);
    if (current?.state === EtsyListingState.Active) {
      await this.listings.update(shop, externalId, stateField(EtsyListingState.Inactive));
    }
  }

  /** Checks the setup, images and options first: a listing without them never reaches Etsy. */
  private async plan(session: ChannelSession, draft: ListingDraft): Promise<ListingPlan> {
    const setup = requireListingSetup(draft.accountSettings ?? session.settings);
    if (listingImages(draft).length === 0) {
      throw ChannelError.unmet(ChannelType.Etsy, ETSY_NO_IMAGES);
    }
    if (!hasListableOptions(draft.variants.length, draft.product.optionNames)) {
      throw ChannelError.unmet(ChannelType.Etsy, ETSY_UNNAMED_OPTIONS);
    }
    const shop = await etsyShopContext(session);
    const category = await this.categoryOf(shop, draft);
    const terms = { setup, taxonomyId: category.id };
    return { shop, draft, terms, category, skus: assignEtsySkus(draft.variants) };
  }

  /** The listing's category, or the best match for its title. */
  private async categoryOf(shop: EtsyShopContext, draft: ListingDraft): Promise<ChannelCategory> {
    if (draft.category) return draft.category;
    const [best] = await this.taxonomy.suggest(shop.accessToken, draft.product.title);
    if (!best) {
      throw ChannelError.unmet(ChannelType.Etsy, NO_CATEGORY);
    }
    return best;
  }

  private async writeContent(
    plan: ListingPlan,
    listingId: string,
    withImages: boolean,
  ): Promise<void> {
    if (withImages) {
      await this.images.sync(plan.shop, listingId, plan.draft);
    }
    const { body, maxVariations } = toInventoryInput(
      plan.draft,
      plan.skus,
      plan.terms.setup.processingProfileId,
    );
    await this.inventory.write(plan.shop, listingId, body, maxVariations);
  }

  /** Activates or deactivates the listing as the product is; answers whether it is active. */
  private async applyState(
    plan: ListingPlan,
    listingId: string,
    current: string,
  ): Promise<boolean> {
    const target = targetState(plan.draft.product.active, current);
    if (target) {
      await this.listings.update(plan.shop, listingId, stateField(target));
    }
    return (target ?? current) === EtsyListingState.Active;
  }

  private toPublished(plan: ListingPlan, outcome: ListingOutcome): PublishedListing {
    const { listingId } = outcome;
    return {
      externalId: listingId,
      externalUrl: outcome.url ?? `${ETSY_LISTING_URL_PREFIX}${listingId}`,
      active: outcome.active,
      variants: plan.draft.variants.map((variant) => {
        const sku = plan.skus.get(variant.variantId) ?? variant.variantId;
        return {
          variantId: variant.variantId,
          externalId: sku,
          externalInventoryId: formatInventoryId({ listingId, sku }),
        };
      }),
      category: plan.category,
    };
  }
}

/** The state to set: active for an active product, inactive otherwise; null to leave it. */
function targetState(wantsActive: boolean, current: string): EtsyListingState | null {
  if (wantsActive) return ACTIVATABLE.has(current) ? EtsyListingState.Active : null;
  return current === EtsyListingState.Active ? EtsyListingState.Inactive : null;
}
