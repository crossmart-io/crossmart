import { z } from 'zod';
import { EtsyWhenMade, EtsyWhoMade } from '../etsy.enums.js';

/** A shipping or processing profile of the shop, as the merchant picks one. */
export const etsyProfileSchema = z.object({ id: z.string().min(1), name: z.string() }).strict();

export type EtsyProfile = z.infer<typeof etsyProfileSchema>;

/** The shop's profiles, read on connect and on refresh. */
export const etsyShopProfilesSchema = z
  .object({
    shipping: z.array(etsyProfileSchema),
    /** Processing profiles (Etsy's readiness state definitions). */
    processing: z.array(etsyProfileSchema),
  })
  .strict();

export type EtsyShopProfiles = z.infer<typeof etsyShopProfilesSchema>;

export const NO_SHOP_PROFILES: EtsyShopProfiles = { shipping: [], processing: [] };

const profileIdSchema = z.string().min(1).nullable().default(null);

/**
 * What the merchant chose for every listing on the connection: Etsy's required item details
 * and the profiles listings ship under. A null profile follows the shop's only profile of that
 * kind, when it has exactly one.
 */
export const etsyListingSetupSchema = z
  .object({
    whoMade: z.enum(EtsyWhoMade),
    whenMade: z.enum(EtsyWhenMade),
    isSupply: z.boolean(),
    shippingProfileId: profileIdSchema,
    processingProfileId: profileIdSchema,
  })
  .strict();

export type EtsyListingSetup = z.infer<typeof etsyListingSetupSchema>;

/** A listing setup whose profiles resolve to ones the shop has. */
export type CompleteEtsyListingSetup = EtsyListingSetup & {
  shippingProfileId: string;
  processingProfileId: string;
};

/** The chosen profile while the shop still has it, else the shop's only one. */
function resolveProfile(chosenId: string | null, profiles: readonly EtsyProfile[]): string | null {
  if (chosenId && profiles.some((profile) => profile.id === chosenId)) return chosenId;
  const [onlyProfile] = profiles;
  return profiles.length === 1 && onlyProfile ? onlyProfile.id : null;
}

/** The setup a listing would be published with, given the shop's current profiles. */
export function resolveListingSetup(
  setup: EtsyListingSetup,
  profiles: EtsyShopProfiles,
): EtsyListingSetup {
  return {
    ...setup,
    shippingProfileId: resolveProfile(setup.shippingProfileId, profiles.shipping),
    processingProfileId: resolveProfile(setup.processingProfileId, profiles.processing),
  };
}

export function isCompleteListingSetup(setup: EtsyListingSetup): setup is CompleteEtsyListingSetup {
  return setup.shippingProfileId !== null && setup.processingProfileId !== null;
}
