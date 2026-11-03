import { z } from 'zod';
import { SHOPIFY_THROTTLED_CODE } from '../shopify.constants.js';

const throttleStatusSchema = z.object({
  maximumAvailable: z.number(),
  currentlyAvailable: z.number(),
  restoreRate: z.number(),
});

const costSchema = z.object({
  requestedQueryCost: z.number(),
  actualQueryCost: z.number().nullable().optional(),
  throttleStatus: throttleStatusSchema,
});

const graphqlErrorSchema = z.object({
  message: z.string(),
  extensions: z.object({ code: z.string().optional() }).loose().optional(),
});

/** The envelope of every Admin GraphQL response. `data` is validated per operation. */
export const shopifyGraphqlEnvelopeSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(graphqlErrorSchema).optional(),
  extensions: z.object({ cost: costSchema.optional() }).loose().optional(),
});

export type ShopifyGraphqlEnvelope = z.infer<typeof shopifyGraphqlEnvelopeSchema>;
export type ShopifyQueryCost = z.infer<typeof costSchema>;

export function isThrottled(envelope: ShopifyGraphqlEnvelope): boolean {
  return (envelope.errors ?? []).some((error) => error.extensions?.code === SHOPIFY_THROTTLED_CODE);
}
