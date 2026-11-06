import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingPublisher,
  ListingReference,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { type EbayAccountContext, ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApp } from '../ebay-app.js';
import { ebayError } from '../ebay-errors.js';
import { assignSkus, inventoryGroupKey } from './ebay-keys.js';
import { EbayInventoryClient } from './ebay-inventory.client.js';
import { EbayListingCategory } from './ebay-listing-category.js';
import { listingTermsOf } from './ebay-listing-terms.js';
import { ebayListingUrl } from './ebay-listing-url.js';
import { EbayOfferClient } from './ebay-offer.client.js';
import { toOfferDetails } from './ebay-offer.mapper.js';
import type { EbayOfferTerms } from './ebay-offer.types.js';
import { listingImageUrls, toInventoryItem, toInventoryItemGroup } from './ebay-product.mapper.js';
import type { EbayCondition } from '../listing/ebay-condition.enum.js';

export const NOT_ACTIVE =
  'eBay listings cannot be hidden. Make the product active, or set it visible on this store.';
export const NO_REFERENCE = 'Crossmart cannot find this listing’s items on eBay. End it on eBay.';
export const NO_IMAGES =
  'eBay needs at least one photo. Add an image to this product (eBay takes only https links).';
export const NO_OPTIONS =
  'Give this product’s options names (such as Size) to list its variants on eBay.';

/** Everything one listing write needs, resolved before the first call to eBay. */
interface ListingPlan {
  account: EbayAccountContext;
  draft: ListingDraft;
  skus: Map<string, string>;
  category: ChannelCategory;
  offerTerms: EbayOfferTerms;
  condition: EbayCondition;
}

/** How a write left the listing. */
interface ListingOutcome {
  listingId: string;
  active: boolean;
  category: ChannelCategory | null;
}

/**
 * Lists products through the Sell Inventory API: an inventory item per variant (keyed by its
 * SKU), an inventory item group for multi-variant products, and an offer per SKU, published
 * as one listing. Every write creates or replaces by key, so publishing again revises the
 * listing instead of duplicating it. Ending a listing withdraws its offers and keeps the items.
 * Prices alone go through `EbayPriceUpdater`.
 */
@Injectable()
export class EbayListingPublisher implements Omit<ListingPublisher, 'updatePrices'> {
  constructor(
    private readonly app: EbayApp,
    private readonly inventory: EbayInventoryClient,
    private readonly offers: EbayOfferClient,
    private readonly categories: EbayListingCategory,
  ) {}

  async publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    if (!draft.product.active) {
      throw ebayError(ChannelErrorCode.RequestRejected, NOT_ACTIVE);
    }
    return this.list(session, draft);
  }

  /** Revises the listing; a product no longer active has its listing ended, ready to relist. */
  async update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    if (draft.product.active) {
      return this.list(session, draft);
    }
    const skus = assignSkus(draft.variants);
    await this.delist(session, externalId, {
      productId: draft.productId,
      variantExternalIds: [...skus.values()],
    });
    const account = await ebayAccountContext(session);
    return this.toPublished(account, draft, skus, {
      listingId: externalId,
      active: false,
      category: draft.category ?? null,
    });
  }

  async delist(
    session: ChannelSession,
    _externalId: string,
    reference?: ListingReference,
  ): Promise<void> {
    if (!reference) {
      throw ebayError(ChannelErrorCode.RequestRejected, NO_REFERENCE);
    }
    const account = await ebayAccountContext(session);
    if (reference.variantExternalIds.length > 1) {
      return this.offers.withdrawGroup(account, inventoryGroupKey(reference.productId));
    }
    const [sku] = reference.variantExternalIds;
    const offer = sku ? await this.offers.find(account, sku) : null;
    if (offer?.listing?.listingId) {
      await this.offers.withdraw(account, offer.offerId);
    }
  }

  private async list(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    const plan = await this.plan(session, draft);
    const listingId =
      draft.variants.length > 1 ? await this.listGroup(plan) : await this.listSingle(plan);
    return this.toPublished(plan.account, draft, plan.skus, {
      listingId,
      active: true,
      category: plan.category,
    });
  }

  /** Checks the connection's defaults first: a listing without them never reaches eBay. */
  private async plan(session: ChannelSession, draft: ListingDraft): Promise<ListingPlan> {
    const terms = listingTermsOf(draft);
    if (listingImageUrls(draft).length === 0) {
      throw ebayError(ChannelErrorCode.RequestRejected, NO_IMAGES);
    }
    const account = await ebayAccountContext(session);
    const category = await this.categories.resolve(account, draft);
    await this.categories.assertRequiredAspects(account, draft, category);
    return {
      account,
      draft,
      skus: assignSkus(draft.variants),
      condition: terms.condition,
      category,
      offerTerms: {
        categoryId: category.id,
        policies: terms.policies,
        merchantLocationKey: terms.merchantLocationKey,
        currency: account.marketplace.currencyCode,
      },
    };
  }

  private async listSingle(plan: ListingPlan): Promise<string> {
    const [variant] = plan.draft.variants;
    const sku = variant ? plan.skus.get(variant.variantId) : undefined;
    if (!variant || !sku) {
      throw ebayError(ChannelErrorCode.RequestRejected, NO_OPTIONS);
    }
    await this.inventory.putItem(
      plan.account,
      sku,
      toInventoryItem(plan.draft, variant, plan.condition),
    );
    const details = toOfferDetails(plan.draft, variant, plan.offerTerms);
    const offerId = await this.offers.save(plan.account, sku, details);
    return this.offers.publish(plan.account, offerId);
  }

  /** Items first, then the group naming them, then an offer per SKU, published together. */
  private async listGroup(plan: ListingPlan): Promise<string> {
    const { account, draft, skus } = plan;
    if (draft.product.optionNames.length === 0) {
      throw ebayError(ChannelErrorCode.RequestRejected, NO_OPTIONS);
    }
    for (const variant of draft.variants) {
      const sku = skus.get(variant.variantId) ?? '';
      await this.inventory.putItem(account, sku, toInventoryItem(draft, variant, plan.condition));
    }
    const groupKey = inventoryGroupKey(draft.productId);
    await this.inventory.putGroup(account, groupKey, toInventoryItemGroup(draft, skus));
    for (const variant of draft.variants) {
      const sku = skus.get(variant.variantId) ?? '';
      await this.offers.save(account, sku, toOfferDetails(draft, variant, plan.offerTerms));
    }
    return this.offers.publishGroup(account, groupKey);
  }

  private toPublished(
    account: EbayAccountContext,
    draft: ListingDraft,
    skus: ReadonlyMap<string, string>,
    outcome: ListingOutcome,
  ): PublishedListing {
    const { environment } = this.app.settings();
    return {
      externalId: outcome.listingId,
      externalUrl: ebayListingUrl(outcome.listingId, account.marketplace, environment),
      active: outcome.active,
      variants: draft.variants.map((variant) => {
        const sku = skus.get(variant.variantId) ?? variant.variantId;
        // Stock is set per SKU, so the SKU is the variant's inventory id too.
        return { variantId: variant.variantId, externalId: sku, externalInventoryId: sku };
      }),
      category: outcome.category,
    };
  }
}
