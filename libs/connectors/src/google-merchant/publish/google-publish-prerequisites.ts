import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../../sdk/publishing/unmet-publish-requirement.js';
import { isGoogleMerchantSettings } from '../google-merchant-settings.js';

export const NO_SETUP =
  'Choose the country and the product page address in this Google connection’s listing setup.';
export const NO_IMAGE =
  'Google needs at least one photo. Add an image to this product (Google takes only https links).';

const HTTPS_PREFIX = 'https://';

export const GOOGLE_NO_SETUP: UnmetPublishRequirement = {
  requirement: PublishRequirement.ListingSetup,
  reason: NO_SETUP,
};

export const GOOGLE_NO_IMAGE: UnmetPublishRequirement = {
  requirement: PublishRequirement.Images,
  reason: NO_IMAGE,
};

/** Google lists nothing until the merchant saves the connection's listing setup. */
export function unmetGoogleAccountRequirements(
  settings: ChannelSettings | null | undefined,
): UnmetPublishRequirement[] {
  return settings && isGoogleMerchantSettings(settings) && settings.listingSetup
    ? []
    : [GOOGLE_NO_SETUP];
}

/** Google needs at least one https image. */
export function unmetGoogleProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  return candidate.imageUrls.some((url) => url.startsWith(HTTPS_PREFIX)) ? [] : [GOOGLE_NO_IMAGE];
}
