import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { ebayError } from '../ebay-errors.js';
import { type EbaySettings, isEbaySettings } from '../ebay-settings.js';
import type { EbayCondition } from '../listing/ebay-condition.enum.js';
import { resolveListingDefaults } from '../listing/ebay-listing-defaults.js';
import type { EbayListingPolicies } from './ebay-offer.types.js';

export const MISSING_SETTINGS =
  'This eBay connection has no account settings. Connect the eBay account again.';
export const MISSING_POLICIES =
  'Choose shipping, payment and return policies for this eBay connection.';
export const MISSING_LOCATION =
  'Set where items ship from in this eBay connection’s listing defaults.';

/** What every listing on the connection is sold under, from the merchant's defaults. */
export interface EbayListingTerms {
  policies: EbayListingPolicies;
  merchantLocationKey: string;
  condition: EbayCondition;
}

function requireSettings(draft: ListingDraft): EbaySettings {
  const settings = draft.accountSettings;
  if (!settings || !isEbaySettings(settings)) {
    throw ebayError(ChannelErrorCode.RequestRejected, MISSING_SETTINGS);
  }
  return settings;
}

/**
 * The connection's policies, ship-from location and condition. A connection without them
 * cannot list anything, so the listing fails with what to set instead of calling eBay.
 */
export function listingTermsOf(draft: ListingDraft): EbayListingTerms {
  const settings = requireSettings(draft);
  const defaults = resolveListingDefaults(settings.listingDefaults, settings.policies);
  const { fulfillmentPolicyId, paymentPolicyId, returnPolicyId } = defaults;
  if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
    throw ebayError(ChannelErrorCode.RequestRejected, MISSING_POLICIES);
  }
  if (!defaults.merchantLocationKey) {
    throw ebayError(ChannelErrorCode.RequestRejected, MISSING_LOCATION);
  }
  return {
    policies: { fulfillmentPolicyId, paymentPolicyId, returnPolicyId },
    merchantLocationKey: defaults.merchantLocationKey,
    condition: defaults.condition,
  };
}
