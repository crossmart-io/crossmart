import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../../sdk/publishing/unmet-publish-requirement.js';
import { isMercadoLibreSettings, type MercadoLibreSettings } from '../mercadolibre-settings.js';

export const MERCADOLIBRE_NO_SETTINGS: UnmetPublishRequirement = {
  requirement: PublishRequirement.AccountSettings,
  reason: 'This Mercado Libre connection has no account details. Connect it again.',
};

export const MERCADOLIBRE_NO_IMAGES: UnmetPublishRequirement = {
  requirement: PublishRequirement.Images,
  reason: 'Mercado Libre needs at least one photo. Add an image to this product.',
};

export const MERCADOLIBRE_NO_CATEGORY: UnmetPublishRequirement = {
  requirement: PublishRequirement.Category,
  reason: 'Mercado Libre suggested no category for this product. Choose one for it.',
};

const MISSING_ATTRIBUTES_PREFIX = 'Mercado Libre requires these item specifics in this category: ';
const MISSING_ATTRIBUTES_SUFFIX = '. Add them in the listing’s item specifics.';
const NAME_SEPARATOR = ', ';

/** The refusal of a listing sent without its category's required attributes. */
export function missingAttributesRequirement(names: readonly string[]): UnmetPublishRequirement {
  return {
    requirement: PublishRequirement.ItemSpecifics,
    reason: `${MISSING_ATTRIBUTES_PREFIX}${names.join(NAME_SEPARATOR)}${MISSING_ATTRIBUTES_SUFFIX}`,
  };
}

/** Listings need the seller's site and currency, read on connect. */
export function unmetMercadoLibreAccountRequirements(
  settings: ChannelSettings | null | undefined,
): UnmetPublishRequirement[] {
  return settings && isMercadoLibreSettings(settings) ? [] : [MERCADOLIBRE_NO_SETTINGS];
}

/** Mercado Libre lists an item only with a picture. */
export function unmetMercadoLibreProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  return candidate.imageUrls.length > 0 ? [] : [MERCADOLIBRE_NO_IMAGES];
}

/** The connection's settings; refuses the publish without them. */
export function requireMercadoLibreSettings(
  settings: ChannelSettings | null | undefined,
): MercadoLibreSettings {
  if (!settings || !isMercadoLibreSettings(settings)) {
    throw ChannelError.unmet(ChannelType.MercadoLibre, MERCADOLIBRE_NO_SETTINGS);
  }
  return settings;
}
