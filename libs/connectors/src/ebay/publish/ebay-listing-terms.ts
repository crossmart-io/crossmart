import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { isEbaySettings } from '../ebay-settings.js';
import type { EbayCondition } from '../listing/ebay-condition.enum.js';
import { resolveListingDefaults } from '../listing/ebay-listing-defaults.js';
import type { EbayListingPolicies } from './ebay-offer.types.js';
import {
  type CompleteListingDefaults,
  EBAY_NO_SETTINGS,
  isCompleteListingDefaults,
  unmetEbayAccountRequirements,
} from './ebay-publish-prerequisites.js';

/** What every listing on the connection is sold under, from the merchant's defaults. */
export interface EbayListingTerms {
  policies: EbayListingPolicies;
  merchantLocationKey: string;
  condition: EbayCondition;
}

/** The defaults a listing is published with, or the first thing they lack, thrown. */
function requireCompleteDefaults(draft: ListingDraft): CompleteListingDefaults {
  const settings = draft.accountSettings;
  const defaults =
    settings && isEbaySettings(settings)
      ? resolveListingDefaults(settings.listingDefaults, settings.policies)
      : null;
  if (defaults && isCompleteListingDefaults(defaults)) return defaults;
  const [unmet] = unmetEbayAccountRequirements(settings);
  throw ChannelError.unmet(ChannelType.Ebay, unmet ?? EBAY_NO_SETTINGS);
}

/**
 * The connection's policies, ship-from location and condition. A connection without them
 * cannot list anything, so the listing fails with what to set instead of calling eBay.
 */
export function listingTermsOf(draft: ListingDraft): EbayListingTerms {
  const defaults = requireCompleteDefaults(draft);
  const { fulfillmentPolicyId, paymentPolicyId, returnPolicyId } = defaults;
  return {
    policies: { fulfillmentPolicyId, paymentPolicyId, returnPolicyId },
    merchantLocationKey: defaults.merchantLocationKey,
    condition: defaults.condition,
  };
}
