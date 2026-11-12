import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { SELLER_ID_PATTERN, USER_ID_MAX_LENGTH } from './falabella.constants.js';
import { FalabellaCountry } from './falabella.enums.js';

const CURRENCY_CODE_LENGTH = 3;

/**
 * What Crossmart keeps about a connected Falabella account: the country it sells in, the seller
 * id the User-Agent names, and the Seller Center user the API key belongs to. The key itself is
 * sealed with the credentials, never stored here.
 */
export const falabellaSettingsSchema = z
  .object({
    channel: z.literal(ChannelType.Falabella),
    country: z.enum(FalabellaCountry),
    sellerId: z.string().regex(SELLER_ID_PATTERN),
    userId: z.string().min(1).max(USER_ID_MAX_LENGTH),
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
  })
  .strict();

export type FalabellaSettings = z.infer<typeof falabellaSettingsSchema> & ChannelSettings;

export function parseFalabellaSettings(raw: unknown): FalabellaSettings {
  return falabellaSettingsSchema.parse(raw);
}

export function isFalabellaSettings(settings: ChannelSettings): settings is FalabellaSettings {
  return settings.channel === ChannelType.Falabella;
}
