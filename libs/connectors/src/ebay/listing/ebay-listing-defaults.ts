import { z } from 'zod';
import type { EbayBusinessPolicies, EbayPolicy } from '../account/ebay-business-policies.js';
import {
  CITY_MAX_LENGTH,
  COUNTRY_CODE_PATTERN,
  POLICY_ID_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
} from '../ebay.constants.js';
import { EbayCondition } from './ebay-condition.enum.js';

/** Where the merchant's items ship from. */
export const ebayShipFromSchema = z
  .object({
    postalCode: z.string().trim().min(1).max(POSTAL_CODE_MAX_LENGTH),
    /** ISO 3166 alpha-2, such as `US`. */
    country: z.string().regex(COUNTRY_CODE_PATTERN),
    city: z.string().trim().min(1).max(CITY_MAX_LENGTH).nullable().default(null),
  })
  .strict();

export type EbayShipFrom = z.infer<typeof ebayShipFromSchema>;

const policyIdSchema = z.string().min(1).max(POLICY_ID_MAX_LENGTH).nullable().default(null);

/**
 * What the merchant chose for every listing on the connection. A null policy follows the
 * account's only policy of that type, when it has exactly one.
 */
export const ebayListingDefaultsSchema = z
  .object({
    fulfillmentPolicyId: policyIdSchema,
    paymentPolicyId: policyIdSchema,
    returnPolicyId: policyIdSchema,
    condition: z.enum(EbayCondition).default(EbayCondition.New),
    location: ebayShipFromSchema.nullable().default(null),
    /** The inventory location Crossmart created on eBay for `location`. */
    merchantLocationKey: z.string().min(1).nullable().default(null),
  })
  .strict();

export type EbayListingDefaults = z.infer<typeof ebayListingDefaultsSchema>;

export const NO_LISTING_DEFAULTS: EbayListingDefaults = ebayListingDefaultsSchema.parse({});

/** The chosen policy while the account still has it, else the account's only one. */
function resolvePolicy(chosenId: string | null, policies: readonly EbayPolicy[]): string | null {
  if (chosenId && policies.some((policy) => policy.id === chosenId)) return chosenId;
  const [onlyPolicy] = policies;
  return policies.length === 1 && onlyPolicy ? onlyPolicy.id : null;
}

/**
 * The defaults a listing would be published with, given the account's current policies: each
 * policy resolved to the one a listing would use, or null.
 */
export function resolveListingDefaults(
  defaults: EbayListingDefaults | null | undefined,
  policies: EbayBusinessPolicies,
): EbayListingDefaults {
  const chosen = defaults ?? NO_LISTING_DEFAULTS;
  return {
    ...chosen,
    fulfillmentPolicyId: resolvePolicy(chosen.fulfillmentPolicyId, policies.fulfillment),
    paymentPolicyId: resolvePolicy(chosen.paymentPolicyId, policies.payment),
    returnPolicyId: resolvePolicy(chosen.returnPolicyId, policies.return),
  };
}
