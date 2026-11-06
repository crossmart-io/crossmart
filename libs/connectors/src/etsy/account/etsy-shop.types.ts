import { z } from 'zod';
import { EtsyReadinessState } from '../etsy.enums.js';

/** `getMe`: the user who signed in, and their shop when they have one. */
export const etsyMeSchema = z.object({
  user_id: z.number().int().positive(),
  shop_id: z.number().int().positive().nullish(),
});

/**
 * `getShop`: the fields Crossmart keeps. The owner's login name and the shop's policies are
 * dropped by the schema.
 */
export const etsyShopSchema = z.object({
  shop_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  shop_name: z.string().min(1),
  currency_code: z.string(),
  url: z.string().nullish(),
});

export type EtsyShop = z.infer<typeof etsyShopSchema>;

/** `getShopShippingProfiles`. */
export const etsyShippingProfilesSchema = z.object({
  results: z.array(
    z.object({
      shipping_profile_id: z.number().int().positive(),
      title: z.string().nullish(),
      is_deleted: z.boolean().default(false),
    }),
  ),
});

const processingProfileSchema = z.object({
  readiness_state_id: z.number().int().positive(),
  readiness_state: z.string(),
  min_processing_days: z.number().int().nonnegative().nullish(),
  max_processing_days: z.number().int().nonnegative().nullish(),
  processing_days_display_label: z.string().nullish(),
});

export type EtsyProcessingProfile = z.infer<typeof processingProfileSchema>;

/** `getShopReadinessStateDefinitions`: the shop's processing profiles. */
export const etsyProcessingProfilesSchema = z.object({
  results: z.array(processingProfileSchema),
});

export const READINESS_STATE_LABELS: Readonly<Record<EtsyReadinessState, string>> = {
  [EtsyReadinessState.ReadyToShip]: 'Ready to ship',
  [EtsyReadinessState.MadeToOrder]: 'Made to order',
};
