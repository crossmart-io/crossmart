import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { MERCADOLIBRE_NUMERIC_ID_PATTERN } from './mercadolibre.constants.js';
import { MercadoLibreSiteId } from './mercadolibre-site.js';

const CURRENCY_CODE_LENGTH = 3;

/** What Crossmart keeps about a connected Mercado Libre seller, read from `GET /users/me`. */
export const mercadoLibreSettingsSchema = z
  .object({
    channel: z.literal(ChannelType.MercadoLibre),
    userId: z.string().regex(MERCADOLIBRE_NUMERIC_ID_PATTERN),
    nickname: z.string().min(1),
    /** The site the seller sells on; their listings are published there. */
    siteId: z.enum(MercadoLibreSiteId),
    /** The site's currency: what listings are priced in. */
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
    /** The seller's public profile. */
    permalink: z.string().nullable(),
    /**
     * Whether the seller lists under User Products (`user_product_seller`): one item per
     * variant grouped by `family_name`, instead of one item with variations.
     */
    userProductSeller: z.boolean(),
  })
  .strict();

export type MercadoLibreSettings = z.infer<typeof mercadoLibreSettingsSchema> & ChannelSettings;

export function parseMercadoLibreSettings(raw: unknown): MercadoLibreSettings {
  return mercadoLibreSettingsSchema.parse(raw);
}

export function isMercadoLibreSettings(
  settings: ChannelSettings,
): settings is MercadoLibreSettings {
  return settings.channel === ChannelType.MercadoLibre;
}
