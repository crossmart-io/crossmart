import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ebayBusinessPoliciesSchema } from './account/ebay-business-policies.js';
import { EbayMarketplaceId } from './ebay-marketplace.js';

const CURRENCY_CODE_LENGTH = 3;

/** What Crossmart keeps about a connected eBay account on one marketplace, read on connect. */
export const ebaySettingsSchema = z
  .object({
    channel: z.literal(ChannelType.Ebay),
    marketplaceId: z.enum(EbayMarketplaceId),
    /** The marketplace's currency: what listings on it are priced in. */
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
    username: z.string().min(1),
    userId: z.string().min(1),
    /** False when the account has not opted in to business policies; `policies` is then empty. */
    businessPoliciesEnabled: z.boolean(),
    /** The seller's business policies on the marketplace, needed to publish listings. */
    policies: ebayBusinessPoliciesSchema,
  })
  .strict();

export type EbaySettings = z.infer<typeof ebaySettingsSchema> & ChannelSettings;

export function parseEbaySettings(raw: unknown): EbaySettings {
  return ebaySettingsSchema.parse(raw);
}

export function isEbaySettings(settings: ChannelSettings): settings is EbaySettings {
  return settings.channel === ChannelType.Ebay;
}
