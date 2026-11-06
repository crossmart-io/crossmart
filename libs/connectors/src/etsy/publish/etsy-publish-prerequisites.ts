import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../../sdk/publishing/unmet-publish-requirement.js';
import { ETSY_CUSTOM_PROPERTY_IDS } from '../etsy.constants.js';
import { isEtsySettings } from '../etsy-settings.js';
import {
  type CompleteEtsyListingSetup,
  isCompleteListingSetup,
  resolveListingSetup,
} from '../listing/etsy-listing-setup.js';
import { isHttpsImage } from './etsy-listing-images.js';

export const ETSY_NO_SETTINGS: UnmetPublishRequirement = {
  requirement: PublishRequirement.AccountSettings,
  reason: 'This Etsy connection has no shop settings. Connect the Etsy shop again.',
};
export const ETSY_NO_ITEM_DETAILS: UnmetPublishRequirement = {
  requirement: PublishRequirement.ItemDetails,
  reason:
    'Say who made your items, when, and whether they are supplies in this Etsy connection’s listing setup.',
};
export const ETSY_NO_SHIPPING_PROFILE: UnmetPublishRequirement = {
  requirement: PublishRequirement.ShippingProfile,
  reason: 'Choose a shipping profile in this Etsy connection’s listing setup.',
};
export const ETSY_NO_PROCESSING_PROFILE: UnmetPublishRequirement = {
  requirement: PublishRequirement.ProcessingProfile,
  reason: 'Choose a processing profile in this Etsy connection’s listing setup.',
};
export const ETSY_NO_IMAGES: UnmetPublishRequirement = {
  requirement: PublishRequirement.Images,
  reason: 'Etsy needs at least one photo. Add an image to this product (an https link).',
};
export const ETSY_UNNAMED_OPTIONS: UnmetPublishRequirement = {
  requirement: PublishRequirement.OptionNames,
  reason:
    'Give this product’s options names (such as Size), at most three, to list its variants on Etsy.',
};

/** Variants list as Etsy variations: one named option each, at most three. */
export function hasListableOptions(variantCount: number, optionNames: readonly string[]): boolean {
  return (
    variantCount <= 1 ||
    (optionNames.length > 0 && optionNames.length <= ETSY_CUSTOM_PROPERTY_IDS.length)
  );
}

/**
 * What the connection's listing setup lacks: the item details, then a shipping and a
 * processing profile (resolved as a listing would resolve them). Empty when listings can be
 * published.
 */
export function unmetEtsyAccountRequirements(
  settings: ChannelSettings | null | undefined,
): UnmetPublishRequirement[] {
  if (!settings || !isEtsySettings(settings)) return [ETSY_NO_SETTINGS];
  if (!settings.listingSetup) {
    return [ETSY_NO_ITEM_DETAILS, ETSY_NO_SHIPPING_PROFILE, ETSY_NO_PROCESSING_PROFILE];
  }
  const setup = resolveListingSetup(settings.listingSetup, settings.profiles);
  return [
    ...(setup.shippingProfileId ? [] : [ETSY_NO_SHIPPING_PROFILE]),
    ...(setup.processingProfileId ? [] : [ETSY_NO_PROCESSING_PROFILE]),
  ];
}

/**
 * Etsy publishes a listing only with an image (Crossmart uploads `https` ones), and lists
 * variants by named options. An inactive product is listed as a draft, so it needs nothing.
 */
export function unmetEtsyProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  return [
    ...(candidate.imageUrls.some(isHttpsImage) ? [] : [ETSY_NO_IMAGES]),
    ...(hasListableOptions(candidate.variantCount, candidate.optionNames)
      ? []
      : [ETSY_UNNAMED_OPTIONS]),
  ];
}

/** The resolved listing setup; refuses the publish, naming what is missing, without one. */
export function requireListingSetup(
  settings: ChannelSettings | null | undefined,
): CompleteEtsyListingSetup {
  const [unmet] = unmetEtsyAccountRequirements(settings);
  if (unmet || !settings || !isEtsySettings(settings) || !settings.listingSetup) {
    throw ChannelError.unmet(ChannelType.Etsy, unmet ?? ETSY_NO_SETTINGS);
  }
  const setup = resolveListingSetup(settings.listingSetup, settings.profiles);
  if (!isCompleteListingSetup(setup)) {
    throw ChannelError.unmet(ChannelType.Etsy, ETSY_NO_SHIPPING_PROFILE);
  }
  return setup;
}
