import { z } from 'zod';

/**
 * The parts of a Fulfillment API order Crossmart reads. Everything else, such as `buyer` and
 * `fulfillmentStartInstructions` (the ship-to address), is dropped by the schema, so buyer
 * details never leave the HTTP layer.
 */
const amountSchema = z.object({ value: z.string(), currency: z.string() });

export type EbayOrderAmount = z.infer<typeof amountSchema>;

const lineItemRefundSchema = z.object({ amount: amountSchema.optional() });

const lineItemSchema = z.object({
  lineItemId: z.string().min(1),
  sku: z.string().optional(),
  title: z.string().default(''),
  quantity: z.number().int().nonnegative(),
  /** The unit price times `quantity`, before discounts. */
  lineItemCost: amountSchema,
  lineItemFulfillmentStatus: z.string().optional(),
  listingMarketplaceId: z.string().optional(),
  refunds: z.array(lineItemRefundSchema).default([]),
});

export type EbayOrderLineItem = z.infer<typeof lineItemSchema>;

const orderRefundSchema = z.object({
  amount: amountSchema.optional(),
  refundStatus: z.string().optional(),
});

export const ebayOrderSchema = z.object({
  orderId: z.string().min(1),
  creationDate: z.string(),
  lastModifiedDate: z.string(),
  cancelStatus: z.object({ cancelState: z.string() }).optional(),
  pricingSummary: z.object({ total: amountSchema }),
  paymentSummary: z.object({ refunds: z.array(orderRefundSchema).default([]) }).optional(),
  lineItems: z.array(lineItemSchema).default([]),
});

export type EbayOrder = z.infer<typeof ebayOrderSchema>;

/** `GET /order`: one page of orders, offset-paginated; `next` is present when more follow. */
export const ebayOrdersPageSchema = z.object({
  offset: z.number().int().nonnegative().default(0),
  next: z.string().optional(),
  orders: z.array(ebayOrderSchema).default([]),
});
