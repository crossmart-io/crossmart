import { z } from 'zod';
import type { ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { GoogleTargetCountry } from './google-merchant-country.js';
import {
  MERCHANT_ACCOUNT_ID_PATTERN,
  PRODUCT_URL_HANDLE_PLACEHOLDER,
} from './google-merchant.constants.js';

const CURRENCY_CODE_LENGTH = 3;
/** ISO 639-1 language codes are two letters. */
const LANGUAGE_CODE_LENGTH = 2;

/** A product page address with `{handle}` where the product's handle goes. */
export const productUrlTemplateSchema = z
  .url({ protocol: /^https$/ })
  .refine((template) => template.includes(PRODUCT_URL_HANDLE_PLACEHOLDER), {
    message: `Put ${PRODUCT_URL_HANDLE_PLACEHOLDER} where the product goes in the address`,
  });

/**
 * Where listings go: the country they target and the product data source Crossmart created
 * for it, and how each product links to its page on the merchant's website.
 */
export const googleListingSetupSchema = z
  .object({
    country: z.enum(GoogleTargetCountry),
    productUrlTemplate: productUrlTemplateSchema,
    /** The API data source Crossmart publishes into, created when the setup is saved. */
    dataSourceId: z.string().min(1),
  })
  .strict();

export type GoogleListingSetup = z.infer<typeof googleListingSetupSchema>;

/**
 * What Crossmart keeps about a connected Merchant Center account: what it read on connect,
 * and the merchant's listing setup.
 */
export const googleMerchantSettingsSchema = z
  .object({
    channel: z.literal(ChannelType.GoogleMerchant),
    accountId: z.string().regex(MERCHANT_ACCOUNT_ID_PATTERN),
    accountName: z.string().min(1),
    /** The website the account claimed; product links must be on it. */
    homepageUri: z.string().nullable(),
    homepageClaimed: z.boolean(),
    /** The country listings target: the account's business country until the merchant picks. */
    country: z.enum(GoogleTargetCountry),
    /** The country's currency: what listings are priced in. */
    currencyCode: z.string().length(CURRENCY_CODE_LENGTH),
    contentLanguage: z.string().length(LANGUAGE_CODE_LENGTH),
    /** Absent until the merchant saves it; publishing needs it. */
    listingSetup: googleListingSetupSchema.optional(),
  })
  .strict();

export type GoogleMerchantSettings = z.infer<typeof googleMerchantSettingsSchema> & ChannelSettings;

export function parseGoogleMerchantSettings(raw: unknown): GoogleMerchantSettings {
  return googleMerchantSettingsSchema.parse(raw);
}

export function isGoogleMerchantSettings(
  settings: ChannelSettings,
): settings is GoogleMerchantSettings {
  return settings.channel === ChannelType.GoogleMerchant;
}
