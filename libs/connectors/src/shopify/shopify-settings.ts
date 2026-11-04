import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';

const CURRENCY_CODE_LENGTH = 3;

/** What Crossmart keeps about a connected store, read from Shopify on connect. */
export const shopifySettingsSchema = z
  .object({
    channel: z.literal(ChannelType.Shopify),
    shopName: z.string().min(1),
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
    ianaTimezone: z.string().nullable(),
    /** The storefront's public URL, such as `https://shop.example.com`. */
    primaryDomainUrl: z.string().nullable(),
    /** Where Crossmart reads and writes stock: the store's primary location. */
    primaryLocation: z.object({ id: z.string().min(1), name: z.string() }).nullable(),
  })
  .strict();

export type ShopifySettings = z.infer<typeof shopifySettingsSchema> & ChannelSettings;

export function parseShopifySettings(raw: unknown): ShopifySettings {
  return shopifySettingsSchema.parse(raw);
}

export function isShopifySettings(settings: ChannelSettings): settings is ShopifySettings {
  return settings.channel === ChannelType.Shopify;
}
