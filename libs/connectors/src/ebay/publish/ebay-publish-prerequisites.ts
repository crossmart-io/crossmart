import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../../sdk/publishing/unmet-publish-requirement.js';
import { isEbaySettings } from '../ebay-settings.js';
import {
  type EbayListingDefaults,
  resolveListingDefaults,
} from '../listing/ebay-listing-defaults.js';
import { isHttps } from './ebay-product.mapper.js';

export const MISSING_SETTINGS =
  'This eBay connection has no account settings. Connect the eBay account again.';
export const MISSING_SHIPPING_POLICY =
  'Choose a shipping policy in this eBay connection’s listing defaults.';
export const MISSING_PAYMENT_POLICY =
  'Choose a payment policy in this eBay connection’s listing defaults.';
export const MISSING_RETURN_POLICY =
  'Choose a return policy in this eBay connection’s listing defaults.';
export const MISSING_LOCATION =
  'Set where items ship from in this eBay connection’s listing defaults.';
export const NO_IMAGES =
  'eBay needs at least one photo. Add an image to this product (eBay takes only https links).';

/** The listing defaults every listing needs. */
type RequiredDefault =
  'fulfillmentPolicyId' | 'paymentPolicyId' | 'returnPolicyId' | 'merchantLocationKey';

/** Listing defaults with everything a listing needs set. */
export type CompleteListingDefaults = EbayListingDefaults & Record<RequiredDefault, string>;

/** What each listing default lacks when it is unset, in the order the merchant fills them in. */
const DEFAULT_REQUIREMENTS: readonly { field: RequiredDefault; unmet: UnmetPublishRequirement }[] =
  [
    {
      field: 'fulfillmentPolicyId',
      unmet: { requirement: PublishRequirement.ShippingPolicy, reason: MISSING_SHIPPING_POLICY },
    },
    {
      field: 'paymentPolicyId',
      unmet: { requirement: PublishRequirement.PaymentPolicy, reason: MISSING_PAYMENT_POLICY },
    },
    {
      field: 'returnPolicyId',
      unmet: { requirement: PublishRequirement.ReturnPolicy, reason: MISSING_RETURN_POLICY },
    },
    {
      field: 'merchantLocationKey',
      unmet: { requirement: PublishRequirement.ShipFromLocation, reason: MISSING_LOCATION },
    },
  ];

export const EBAY_NO_SETTINGS: UnmetPublishRequirement = {
  requirement: PublishRequirement.AccountSettings,
  reason: MISSING_SETTINGS,
};

export const EBAY_NO_IMAGES: UnmetPublishRequirement = {
  requirement: PublishRequirement.Images,
  reason: NO_IMAGES,
};

export function isCompleteListingDefaults(
  defaults: EbayListingDefaults,
): defaults is CompleteListingDefaults {
  return DEFAULT_REQUIREMENTS.every(({ field }) => Boolean(defaults[field]));
}

/**
 * What the connection's listing defaults lack: a policy of each type (resolved as a listing
 * would resolve it) and a ship-from location. Empty when listings can be published.
 */
export function unmetEbayAccountRequirements(
  settings: ChannelSettings | null | undefined,
): UnmetPublishRequirement[] {
  if (!settings || !isEbaySettings(settings)) return [EBAY_NO_SETTINGS];
  const defaults = resolveListingDefaults(settings.listingDefaults, settings.policies);
  return DEFAULT_REQUIREMENTS.filter(({ field }) => !defaults[field]).map(({ unmet }) => unmet);
}

/** eBay needs at least one https image it can download. */
export function unmetEbayProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  return candidate.imageUrls.some(isHttps) ? [] : [EBAY_NO_IMAGES];
}
