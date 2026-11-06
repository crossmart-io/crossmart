import { z } from 'zod';
import { etsyMoneySchema } from '../publish/etsy-listing.types.js';

/**
 * The parts of a shop receipt Crossmart reads. Everything else (the buyer's name, address,
 * email, messages and gift notes, and the buyer's user id) is dropped by the schema, so buyer
 * details never leave the HTTP layer.
 */
const transactionSchema = z.object({
  transaction_id: z.number().int().positive(),
  title: z.string().nullish(),
  quantity: z.number().int().nonnegative(),
  sku: z.string().nullish(),
  /** The price of one unit. */
  price: etsyMoneySchema,
  shipped_timestamp: z.number().int().nullish(),
});

export type EtsyTransaction = z.infer<typeof transactionSchema>;

const refundSchema = z.object({ amount: etsyMoneySchema });

export const etsyReceiptSchema = z.object({
  receipt_id: z.number().int().positive(),
  status: z.string(),
  is_shipped: z.boolean().default(false),
  created_timestamp: z.number().int(),
  updated_timestamp: z.number().int(),
  grandtotal: etsyMoneySchema,
  transactions: z.array(transactionSchema).default([]),
  refunds: z.array(refundSchema).default([]),
});

export type EtsyReceipt = z.infer<typeof etsyReceiptSchema>;

/** `getShopReceipts`: one page, offset-paginated; `count` is the total. */
export const etsyReceiptsPageSchema = z.object({
  count: z.number().int().nonnegative(),
  results: z.array(etsyReceiptSchema),
});
