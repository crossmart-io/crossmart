import { Injectable } from '@nestjs/common';
import { forEachLimited } from '@crossmart/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingPublisher,
  ListingReference,
  PriceUpdate,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { assignVariantKeys } from '../../sdk/listings/variant-keys.js';
import {
  GOOGLE_OFFER_ID_PATTERN,
  PRODUCT_WRITE_CONCURRENCY,
} from '../google-merchant.constants.js';
import { googleMerchantError } from '../google-merchant-errors.js';
import {
  type GoogleListingSetup,
  type GoogleMerchantSettings,
  isGoogleMerchantSettings,
} from '../google-merchant-settings.js';
import { toGooglePrices } from './google-price.js';
import { toProductInput } from './google-product.mapper.js';
import { type GoogleFeed, GoogleProductInputsClient } from './google-product-inputs.client.js';

export const NO_SETUP =
  'Choose the country and the product page address in this Google connection’s listing setup.';
export const NOT_ACTIVE =
  'Google lists only active products. Make the product active, or set it visible on this store.';
export const NO_IMAGE =
  'Google needs at least one photo. Add an image to this product (Google takes only https links).';
export const NO_REFERENCE = 'Crossmart cannot find this listing’s offers on Google.';

const HTTPS_PREFIX = 'https://';

/** A connection ready to list: its settings, with the listing setup saved. */
interface ReadyAccount {
  settings: GoogleMerchantSettings;
  setup: GoogleListingSetup;
}

/** The variant's offer id: a stable key, derived from the variant id when the SKU cannot be one. */
function offerIds(draft: ListingDraft): Map<string, string> {
  return assignVariantKeys(draft.variants, {
    accepts: GOOGLE_OFFER_ID_PATTERN,
    derive: (variantId) => variantId,
  });
}

function readyAccount(settings: ChannelSettings | null | undefined): ReadyAccount {
  if (!settings || !isGoogleMerchantSettings(settings) || !settings.listingSetup) {
    throw googleMerchantError(ChannelErrorCode.RequestRejected, NO_SETUP);
  }
  return { settings, setup: settings.listingSetup };
}

function feedOf({ settings, setup }: ReadyAccount): GoogleFeed {
  return {
    accountId: settings.accountId,
    dataSourceId: setup.dataSourceId,
    contentLanguage: settings.contentLanguage,
    feedLabel: setup.country,
  };
}

/**
 * Lists products in Google Merchant Center through the Merchant API: one offer (product
 * input) per variant in the connection's API data source, grouped by `itemGroupId`. Writing
 * an offer replaces it, so publishing again updates it. Google has no hidden listings: a
 * product that is no longer active has its offers removed.
 */
@Injectable()
export class GoogleListingPublisher implements ListingPublisher {
  constructor(private readonly inputs: GoogleProductInputsClient) {}

  async publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    if (!draft.product.active) {
      throw googleMerchantError(ChannelErrorCode.RequestRejected, NOT_ACTIVE);
    }
    return this.write(session, draft);
  }

  async update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    if (draft.product.active) return this.write(session, draft);
    const ids = offerIds(draft);
    await this.delist(session, externalId, {
      productId: draft.productId,
      variantExternalIds: [...ids.values()],
    });
    return this.toPublished(draft, ids, false);
  }

  async delist(
    session: ChannelSession,
    _externalId: string,
    reference?: ListingReference,
  ): Promise<void> {
    if (!reference) {
      throw googleMerchantError(ChannelErrorCode.RequestRejected, NO_REFERENCE);
    }
    const feed = feedOf(readyAccount(session.settings));
    const accessToken = await session.accessToken();
    await forEachLimited(reference.variantExternalIds, PRODUCT_WRITE_CONCURRENCY, (offerId) =>
      this.inputs.delete(accessToken, feed, offerId),
    );
  }

  async updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    const account = readyAccount(session.settings);
    const feed = feedOf(account);
    const accessToken = await session.accessToken();
    await forEachLimited(updates, PRODUCT_WRITE_CONCURRENCY, (update) =>
      this.inputs.updatePrice(
        accessToken,
        feed,
        update.externalVariantId,
        toGooglePrices(update, account.settings.currencyCode),
      ),
    );
  }

  private async write(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    const account = readyAccount(draft.accountSettings);
    if (!draft.product.images.some(({ url }) => url.startsWith(HTTPS_PREFIX))) {
      throw googleMerchantError(ChannelErrorCode.RequestRejected, NO_IMAGE);
    }
    const ids = offerIds(draft);
    const feed = feedOf(account);
    const target = {
      contentLanguage: feed.contentLanguage,
      feedLabel: feed.feedLabel,
      currencyCode: account.settings.currencyCode,
      productUrlTemplate: account.setup.productUrlTemplate,
    };
    const accessToken = await session.accessToken();
    await forEachLimited(draft.variants, PRODUCT_WRITE_CONCURRENCY, (variant) =>
      this.inputs.insert(
        accessToken,
        feed,
        toProductInput(draft, variant, ids.get(variant.variantId) ?? variant.variantId, target),
      ),
    );
    return this.toPublished(draft, ids, true);
  }

  /** The listing is the product; each variant is its offer. Google gives no public page. */
  private toPublished(
    draft: ListingDraft,
    ids: Map<string, string>,
    active: boolean,
  ): PublishedListing {
    return {
      externalId: draft.productId,
      externalUrl: null,
      active,
      variants: draft.variants.map((variant) => ({
        variantId: variant.variantId,
        externalId: ids.get(variant.variantId) ?? variant.variantId,
        externalInventoryId: null,
      })),
    };
  }
}
