import { z } from 'zod';

/** A business policy as Crossmart keeps it: enough to pick one when publishing. */
export const ebayPolicySchema = z.object({ id: z.string().min(1), name: z.string() }).strict();

export type EbayPolicy = z.infer<typeof ebayPolicySchema>;

/** The seller's business policies on one marketplace. Listing through the Inventory API needs them. */
export const ebayBusinessPoliciesSchema = z
  .object({
    fulfillment: z.array(ebayPolicySchema),
    payment: z.array(ebayPolicySchema),
    return: z.array(ebayPolicySchema),
  })
  .strict();

export type EbayBusinessPolicies = z.infer<typeof ebayBusinessPoliciesSchema>;

/** The lists of an account that has not opted in to business policies. */
export const NO_BUSINESS_POLICIES: EbayBusinessPolicies = {
  fulfillment: [],
  payment: [],
  return: [],
};

const fulfillmentPoliciesSchema = z.object({
  fulfillmentPolicies: z
    .array(z.object({ fulfillmentPolicyId: z.string().min(1), name: z.string() }))
    .default([]),
});

const paymentPoliciesSchema = z.object({
  paymentPolicies: z
    .array(z.object({ paymentPolicyId: z.string().min(1), name: z.string() }))
    .default([]),
});

const returnPoliciesSchema = z.object({
  returnPolicies: z
    .array(z.object({ returnPolicyId: z.string().min(1), name: z.string() }))
    .default([]),
});

/** Each Account API policy list, read into `{ id, name }` pairs. */
export const EBAY_POLICY_RESPONSES = {
  fulfillment: fulfillmentPoliciesSchema.transform(({ fulfillmentPolicies }) =>
    fulfillmentPolicies.map(({ fulfillmentPolicyId, name }) => ({ id: fulfillmentPolicyId, name })),
  ),
  payment: paymentPoliciesSchema.transform(({ paymentPolicies }) =>
    paymentPolicies.map(({ paymentPolicyId, name }) => ({ id: paymentPolicyId, name })),
  ),
  return: returnPoliciesSchema.transform(({ returnPolicies }) =>
    returnPolicies.map(({ returnPolicyId, name }) => ({ id: returnPolicyId, name })),
  ),
};
