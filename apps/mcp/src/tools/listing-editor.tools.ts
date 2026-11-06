import { z } from 'zod';
import { ListingVisibility } from '@crossmart/database/generated/prisma/enums.js';
import { HttpMethod } from '../api/api-call.js';
import {
  MAX_SHOWN_QUANTITY,
  OVERRIDE_DESCRIPTION_MAX_LENGTH,
  OVERRIDE_MAX_ITEMS,
  OVERRIDE_TEXT_MAX_LENGTH,
} from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { productStorePath } from './store-paths.js';
import { AMOUNT_INPUT, ID_INPUT } from './tool-inputs.js';

/** Parts of a product-on-a-store path. */
const LISTING_PART = 'listing';
const OVERRIDE_PART = 'override';

const PRODUCT_ON_STORE_INPUT = {
  productId: ID_INPUT,
  connectionId: ID_INPUT.describe('The store, from list_stores'),
};

const REVERT_HINT = 'null reverts it to the product';

const OVERRIDE_TEXT = z.string().max(OVERRIDE_TEXT_MAX_LENGTH).nullable().optional();
const SHOWN_QUANTITY = z.number().int().min(0).max(MAX_SHOWN_QUANTITY).nullable().optional();

const VARIANT_PRICE_INPUT = z.object({
  variantId: ID_INPUT.describe('From get_listing'),
  price: AMOUNT_INPUT.nullable().describe(
    'A fixed price in the store’s currency; null follows the pricing rule',
  ),
  compareAtPrice: AMOUNT_INPUT.nullable().describe('null follows the pricing rule'),
});

/** The overrides one update may change; each absent field keeps its current override. */
const OVERRIDE_INPUT = {
  title: OVERRIDE_TEXT.describe(`The store’s title; ${REVERT_HINT}`),
  descriptionHtml: z
    .string()
    .max(OVERRIDE_DESCRIPTION_MAX_LENGTH)
    .nullable()
    .optional()
    .describe(`HTML description for this store; ${REVERT_HINT}`),
  vendor: OVERRIDE_TEXT.describe(`The brand this store shows; ${REVERT_HINT}`),
  tags: z
    .array(z.string().max(OVERRIDE_TEXT_MAX_LENGTH))
    .max(OVERRIDE_MAX_ITEMS)
    .nullable()
    .optional()
    .describe(`Replaces the product’s tags; ${REVERT_HINT}`),
  mediaUrls: z
    .array(z.url())
    .max(OVERRIDE_MAX_ITEMS)
    .nullable()
    .optional()
    .describe(`Which of the product’s image URLs to show, in order; ${REVERT_HINT}`),
  visibility: z
    .enum(ListingVisibility)
    .nullable()
    .optional()
    .describe(`Show or hide on this store whatever the product’s status; ${REVERT_HINT}`),
  inventoryBuffer: SHOWN_QUANTITY.describe('Units held back from this store; null removes it'),
  maxQuantity: SHOWN_QUANTITY.describe('The most units this store shows; null removes it'),
  variantPrices: z
    .array(VARIANT_PRICE_INPUT)
    .max(OVERRIDE_MAX_ITEMS)
    .optional()
    .describe('Per variant; both prices null reverts that variant to the pricing rule'),
};

/** One product's listing on one store, field by field, as the listing editor shows it. */
export const LISTING_EDITOR_TOOLS = [
  defineTool({
    name: 'get_listing',
    title: 'Get a product’s listing on a store',
    description:
      'Every field of one product on one store (title, description, vendor, tags, images, ' +
      'visibility, and each variant’s price) with the product’s value, the store’s override ' +
      '(null when it follows the product), the value the store gets and whether it is ' +
      'overridden. Each variant also has rulePrice, the store’s pricing rule result before a ' +
      'fixed price. Also the stock limits, category, item specifics and display state. Change ' +
      'or revert fields with update_listing.',
    input: PRODUCT_ON_STORE_INPUT,
    readOnly: true,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Get,
      path: productStorePath(productId, connectionId, LISTING_PART),
    }),
  }),
  defineTool({
    name: 'update_listing',
    title: 'Override or revert fields of a listing',
    description:
      'Change how one product shows on one store without touching the catalog. Send only the ' +
      'fields to change: a value overrides the product, null reverts the field to it, and ' +
      'absent fields keep their override. When the store already lists the product, an ' +
      'update is queued. Read the fields first with get_listing.',
    input: { ...PRODUCT_ON_STORE_INPUT, ...OVERRIDE_INPUT },
    readOnly: false,
    toCall: ({ productId, connectionId, ...patch }) => ({
      method: HttpMethod.Patch,
      path: productStorePath(productId, connectionId, OVERRIDE_PART),
      body: patch,
    }),
  }),
];
