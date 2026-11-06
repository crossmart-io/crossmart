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
export const NOT_ACTIVE =
  'eBay listings cannot be hidden. Make the product active, or set it visible on this store.';
export const NO_OPTIONS =
  'Give this product’s options names (such as Size) to list its variants on eBay.';

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

export const EBAY_INACTIVE_PRODUCT: UnmetPublishRequirement = {
  requirement: PublishRequirement.ActiveProduct,
  reason: NOT_ACTIVE,
};

export const EBAY_UNNAMED_OPTIONS: UnmetPublishRequirement = {
  requirement: PublishRequirement.OptionNames,
  reason: NO_OPTIONS,
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

/**
 * What eBay refuses a new listing for, in the order the merchant fixes them: at least one https
 * image it can download, a shown product (eBay has no hidden listings), and named options for a
 * product with several variants.
 */
export function unmetEbayProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  const unmet: UnmetPublishRequirement[] = [];
  if (!candidate.imageUrls.some(isHttps)) unmet.push(EBAY_NO_IMAGES);
  if (!candidate.active) unmet.push(EBAY_INACTIVE_PRODUCT);
  if (candidate.variantCount > 1 && candidate.optionNames.length === 0) {
    unmet.push(EBAY_UNNAMED_OPTIONS);
  }
  return unmet;
}
