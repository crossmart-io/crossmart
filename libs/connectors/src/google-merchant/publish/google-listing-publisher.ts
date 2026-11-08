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
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { assignVariantKeys } from '../../sdk/listings/variant-keys.js';
import {
  GOOGLE_OFFER_ID_PATTERN,
  PRODUCT_WRITE_CONCURRENCY,
} from '../google-merchant.constants.js';
import { GOOGLE_COUNTRY_MARKETS } from '../google-merchant-country.js';
import { googleMerchantError } from '../google-merchant-errors.js';
import {
  type GoogleListingSetup,
  type GoogleMerchantSettings,
  isGoogleMerchantSettings,
} from '../google-merchant-settings.js';
import { toGooglePrices } from './google-price.js';
import {
  GOOGLE_INACTIVE_PRODUCT,
  GOOGLE_NO_IMAGE,
  GOOGLE_NO_SETUP,
  hasGoogleImage,
} from './google-publish-prerequisites.js';
import { toProductInput } from './google-product.mapper.js';
import { type GoogleFeed, GoogleProductInputsClient } from './google-product-inputs.client.js';

export { NO_IMAGE, NO_SETUP, NOT_ACTIVE } from './google-publish-prerequisites.js';
export const NO_REFERENCE = 'Crossmart cannot find this listing’s offers on Google.';

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
    throw ChannelError.unmet(ChannelType.GoogleMerchant, GOOGLE_NO_SETUP);
  }
  return { settings, setup: settings.listingSetup };
}

/**
 * The data source's feed: its language follows the setup's country, the same way the data source
 * was created, never the account's own business country (a reconnect rereads that and may differ).
 */
function feedOf({ settings, setup }: ReadyAccount): GoogleFeed {
  return {
    accountId: settings.accountId,
    dataSourceId: setup.dataSourceId,
    contentLanguage: GOOGLE_COUNTRY_MARKETS[setup.country].contentLanguage,
    feedLabel: setup.country,
  };
}

/** Listings are priced in the setup country's currency, like the feed's language. */
function currencyOf({ setup }: ReadyAccount): string {
  return GOOGLE_COUNTRY_MARKETS[setup.country].currencyCode;
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
      throw ChannelError.unmet(ChannelType.GoogleMerchant, GOOGLE_INACTIVE_PRODUCT);
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
        toGooglePrices(update, currencyOf(account)),
      ),
    );
  }

  private async write(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    const account = readyAccount(draft.accountSettings);
    const imageUrls = draft.product.images.map(({ url }) => url);
    if (!hasGoogleImage(imageUrls)) {
      throw ChannelError.unmet(ChannelType.GoogleMerchant, GOOGLE_NO_IMAGE);
    }
    const ids = offerIds(draft);
    const feed = feedOf(account);
    const target = {
      contentLanguage: feed.contentLanguage,
      feedLabel: feed.feedLabel,
      currencyCode: currencyOf(account),
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
