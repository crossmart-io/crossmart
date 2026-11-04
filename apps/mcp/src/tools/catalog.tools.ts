import { z } from 'zod';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import { HttpMethod } from '../api/api-call.js';
import { WORKSPACE_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { AMOUNT_INPUT, ID_INPUT, PAGE_INPUT, SEARCH_INPUT } from './tool-inputs.js';

const PRODUCTS_PATH = `${WORKSPACE_PATH}/products`;

const VARIANT_INPUT = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  optionValues: z.array(z.string()).optional().describe('One value per product option, in order'),
  price: AMOUNT_INPUT,
  compareAtPrice: AMOUNT_INPUT.optional(),
  cost: AMOUNT_INPUT.optional().describe('What one unit costs you; never shown to buyers'),
  weightGrams: z.number().int().min(0).optional(),
  outOfStockPolicy: z.enum(OutOfStockPolicy).optional(),
  tracked: z.boolean().optional().describe('Whether Crossmart counts its stock (default true)'),
  quantity: z.number().int().min(0).optional().describe('Opening stock, for new variants'),
});

/** A variant of a product being replaced: keep its id to keep it, omit the id to add one. */
const SAVED_VARIANT_INPUT = VARIANT_INPUT.extend({
  id: ID_INPUT.optional().describe('Keep this variant (from get_product); omit to add a new one'),
});

const PRODUCT_INPUT = {
  title: z.string().min(1),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(ProductStatus).optional().describe('DRAFT until it is ready to sell'),
  optionNames: z.array(z.string()).optional().describe('Such as ["Size", "Color"]'),
  media: z
    .array(z.object({ url: z.url(), altText: z.string().optional() }))
    .optional()
    .describe('Public image URLs, first one is the main image'),
  variants: z.array(VARIANT_INPUT).min(1),
};

export const CATALOG_TOOLS = [
  defineTool({
    name: 'list_products',
    title: 'List products',
    description: 'Products in the catalog, by title, with their price range, stock and status.',
    input: { search: SEARCH_INPUT, status: z.enum(ProductStatus).optional(), ...PAGE_INPUT },
    readOnly: true,
    toCall: (input) => ({ method: HttpMethod.Get, path: PRODUCTS_PATH, query: input }),
  }),
  defineTool({
    name: 'get_product',
    title: 'Get a product',
    description: 'One product with every variant, its stock, prices, options and images.',
    input: { productId: ID_INPUT },
    readOnly: true,
    toCall: ({ productId }) => ({ method: HttpMethod.Get, path: `${PRODUCTS_PATH}/${productId}` }),
  }),
  defineTool({
    name: 'create_product',
    title: 'Create a product',
    description:
      'Add a product with its variants. Each variant needs a price; give options when there ' +
      'are several variants. New products are drafts unless status is ACTIVE.',
    input: { ...PRODUCT_INPUT, handle: z.string().optional() },
    readOnly: false,
    toCall: (input) => ({ method: HttpMethod.Post, path: PRODUCTS_PATH, body: input }),
  }),
  defineTool({
    name: 'replace_product',
    title: 'Replace a product',
    description:
      'Save a product as given: fields and variants left out are removed. Read it with ' +
      'get_product first, change what you need, and send the whole product back, keeping each ' +
      'variant’s id. Stock is not changed here; use adjust_stock.',
    input: { productId: ID_INPUT, ...PRODUCT_INPUT, variants: z.array(SAVED_VARIANT_INPUT).min(1) },
    readOnly: false,
    destructive: true,
    toCall: ({ productId, ...product }) => ({
      method: HttpMethod.Put,
      path: `${PRODUCTS_PATH}/${productId}`,
      body: product,
    }),
  }),
];
