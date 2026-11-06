import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { etsyListingSetupSchema, etsyShopProfilesSchema } from './listing/etsy-listing-setup.js';

const CURRENCY_CODE_LENGTH = 3;
const NUMERIC_ID = /^\d+$/;

/**
 * What Crossmart keeps about a connected Etsy shop: what it read on connect (the shop and its
 * shipping and processing profiles), and the merchant's listing setup.
 */
export const etsySettingsSchema = z
  .object({
    channel: z.literal(ChannelType.Etsy),
    shopId: z.string().regex(NUMERIC_ID),
    shopName: z.string().min(1),
    userId: z.string().regex(NUMERIC_ID),
    /** The shop's currency: what its listings are priced in. */
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
    shopUrl: z.string().nullable(),
    profiles: etsyShopProfilesSchema,
    /**
     * Who made the items, when, whether they are supplies, and the profiles they ship under.
     * Absent until saved; never read from Etsy, so connecting again or refreshing keeps it.
     */
    listingSetup: etsyListingSetupSchema.optional(),
  })
  .strict();

export type EtsySettings = z.infer<typeof etsySettingsSchema> & ChannelSettings;

export function parseEtsySettings(raw: unknown): EtsySettings {
  return etsySettingsSchema.parse(raw);
}

export function isEtsySettings(settings: ChannelSettings): settings is EtsySettings {
  return settings.channel === ChannelType.Etsy;
}
