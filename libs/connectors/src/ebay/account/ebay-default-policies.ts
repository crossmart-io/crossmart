import { z } from 'zod';
import {
  EBAY_DEFAULT_FULFILLMENT_POLICY_NAME,
  EBAY_DEFAULT_HANDLING_DAYS,
  EBAY_DEFAULT_PAYMENT_POLICY_NAME,
  EBAY_DEFAULT_RETURN_DAYS,
  EBAY_DEFAULT_RETURN_POLICY_NAME,
  EBAY_FIRST_SORT_ORDER,
  EBAY_FREE_SHIPPING_AMOUNT,
  EBAY_FULFILLMENT_POLICY_PATH,
  EBAY_PAYMENT_POLICY_PATH,
  EBAY_RETURN_POLICY_PATH,
} from '../ebay.constants.js';
import { EbayMarketplaceId } from '../ebay-marketplace.js';
import type { EbayBusinessPolicies } from './ebay-business-policies.js';
import {
  EbayPolicyCategoryType,
  EbayReturnShippingCostPayer,
  EbayShippingCostType,
  EbayShippingOptionType,
  EbayTimeDurationUnit,
} from './ebay-policy.enums.js';

/** A kind of business policy: fulfillment (shipping), payment or return. */
export type EbayPolicyKind = keyof EbayBusinessPolicies;

/** The id of the policy of each kind that listings should use. */
export type EbayDefaultPolicyIds = Record<EbayPolicyKind, string>;

/** What creating the default policies needs to know about the connection. */
export interface EbayDefaultPoliciesRequest {
  /** The marketplace currency, which the free shipping rate is priced in. */
  currencyCode: string;
  /** False opts the account in to business policies before creating them. */
  businessPoliciesEnabled: boolean;
}

/**
 * The standard domestic service of the default shipping policy, per marketplace (eBay's
 * `ShippingServiceCodeType` values). A marketplace without one gets no default policies.
 */
export const EBAY_DEFAULT_SHIPPING_SERVICES: Readonly<Partial<Record<EbayMarketplaceId, string>>> =
  {
    [EbayMarketplaceId.UnitedStates]: 'USPSPriority',
    [EbayMarketplaceId.UnitedKingdom]: 'UK_RoyalMailSecondClassStandard',
    [EbayMarketplaceId.Germany]: 'DE_DHLPaket',
    [EbayMarketplaceId.Australia]: 'AU_StandardDelivery',
  };

/** What every default policy body is built from. */
export interface EbayPolicyTerms {
  marketplaceId: EbayMarketplaceId;
  currencyCode: string;
  shippingServiceCode: string;
}

/** How one default policy is created and named, and where eBay answers its id. */
export interface EbayDefaultPolicySpec {
  name: string;
  path: string;
  body: (terms: EbayPolicyTerms) => Record<string, unknown>;
  createdId: z.ZodType<string>;
}

const CATEGORY_TYPES = [{ name: EbayPolicyCategoryType.AllExcludingMotorsVehicles }];

function basics(name: string, { marketplaceId }: EbayPolicyTerms): Record<string, unknown> {
  return { name, marketplaceId, categoryTypes: CATEGORY_TYPES };
}

/** One domestic option: the marketplace's standard service, free, at a flat rate. */
function fulfillmentBody(terms: EbayPolicyTerms): Record<string, unknown> {
  return {
    ...basics(EBAY_DEFAULT_FULFILLMENT_POLICY_NAME, terms),
    handlingTime: { value: EBAY_DEFAULT_HANDLING_DAYS, unit: EbayTimeDurationUnit.Day },
    shippingOptions: [
      {
        optionType: EbayShippingOptionType.Domestic,
        costType: EbayShippingCostType.FlatRate,
        shippingServices: [
          {
            shippingServiceCode: terms.shippingServiceCode,
            freeShipping: true,
            shippingCost: { value: EBAY_FREE_SHIPPING_AMOUNT, currency: terms.currencyCode },
            sortOrder: EBAY_FIRST_SORT_ORDER,
          },
        ],
      },
    ],
  };
}

/** Immediate payment; eBay manages the payment methods, so none are listed. */
function paymentBody(terms: EbayPolicyTerms): Record<string, unknown> {
  return { ...basics(EBAY_DEFAULT_PAYMENT_POLICY_NAME, terms), immediatePay: true };
}

/** Returns accepted for 30 days; the buyer pays to ship them back. */
function returnBody(terms: EbayPolicyTerms): Record<string, unknown> {
  return {
    ...basics(EBAY_DEFAULT_RETURN_POLICY_NAME, terms),
    returnsAccepted: true,
    returnPeriod: { value: EBAY_DEFAULT_RETURN_DAYS, unit: EbayTimeDurationUnit.Day },
    returnShippingCostPayer: EbayReturnShippingCostPayer.Buyer,
  };
}

/** The three default policies, by kind. */
export const EBAY_DEFAULT_POLICY_SPECS: Readonly<Record<EbayPolicyKind, EbayDefaultPolicySpec>> = {
  fulfillment: {
    name: EBAY_DEFAULT_FULFILLMENT_POLICY_NAME,
    path: EBAY_FULFILLMENT_POLICY_PATH,
    body: fulfillmentBody,
    createdId: z
      .object({ fulfillmentPolicyId: z.string().min(1) })
      .transform(({ fulfillmentPolicyId }) => fulfillmentPolicyId),
  },
  payment: {
    name: EBAY_DEFAULT_PAYMENT_POLICY_NAME,
    path: EBAY_PAYMENT_POLICY_PATH,
    body: paymentBody,
    createdId: z
      .object({ paymentPolicyId: z.string().min(1) })
      .transform(({ paymentPolicyId }) => paymentPolicyId),
  },
  return: {
    name: EBAY_DEFAULT_RETURN_POLICY_NAME,
    path: EBAY_RETURN_POLICY_PATH,
    body: returnBody,
    createdId: z
      .object({ returnPolicyId: z.string().min(1) })
      .transform(({ returnPolicyId }) => returnPolicyId),
  },
};
