import { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { z } from 'zod';
import {
  OutOfStockPolicy,
  ProductCondition,
  ProductStatus,
} from '@crossmart/database/generated/prisma/enums.js';
import { HttpMethod } from '../api/api-call.js';
import {
  AgentToolName,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_HANDLE_MAX_LENGTH,
  PRODUCT_TITLE_MAX_LENGTH,
  WORKSPACE_PATH,
} from '../agent-tools.constants.js';
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
  quantity: z.number().int().min(0).optional().describe('Units on hand'),
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
  condition: z
    .enum(ProductCondition)
    .nullable()
    .optional()
    .describe(
      'The item’s condition, such as USED_GOOD for a pre-owned item with visible wear. Each ' +
        'store gets its own equivalent. Left out keeps the current one; null clears it.',
    ),
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
    scope: AgentScope.CatalogRead,
    toCall: (input) => ({ method: HttpMethod.Get, path: PRODUCTS_PATH, query: input }),
  }),
  defineTool({
    name: AgentToolName.GetProduct,
    title: 'Get a product',
    description: 'One product with every variant, its stock, prices, options and images.',
    input: { productId: ID_INPUT },
    readOnly: true,
    scope: AgentScope.CatalogRead,
    toCall: ({ productId }) => ({ method: HttpMethod.Get, path: `${PRODUCTS_PATH}/${productId}` }),
  }),
  defineTool({
    name: AgentToolName.CreateProduct,
    title: 'Create a product',
    description:
      'Add a product with its variants. Each variant needs a price; give options when there ' +
      'are several variants. New products are drafts unless status is ACTIVE.',
    input: { ...PRODUCT_INPUT, handle: z.string().optional() },
    readOnly: false,
    scope: AgentScope.CatalogWrite,
    toCall: (input) => ({ method: HttpMethod.Post, path: PRODUCTS_PATH, body: input }),
  }),
  defineTool({
    name: AgentToolName.ReplaceProduct,
    title: 'Replace a product',
    description:
      'Save a product as given: fields and variants left out are removed. To change only the ' +
      'title or description, use update_product_text; only a price, update_variant_price. ' +
      'Read it with ' +
      'get_product first, change what you need, and send the whole product back, keeping each ' +
      'variant’s id. A changed quantity is recorded as a stock adjustment, and a variant sent ' +
      'without one keeps its stock; to give a reason, such as a delivery, use adjust_stock instead.',
    input: {
      productId: ID_INPUT,
      handle: z
        .string()
        .min(1)
        .max(PRODUCT_HANDLE_MAX_LENGTH)
        .describe('The product’s URL handle, from get_product; keep it unless asked to change it'),
      ...PRODUCT_INPUT,
      variants: z.array(SAVED_VARIANT_INPUT).min(1),
    },
    readOnly: false,
    priceInputs: ['variants'],
    scope: AgentScope.CatalogWrite,
    destructive: true,
    openWorld: true,
    toCall: ({ productId, ...product }) => ({
      method: HttpMethod.Put,
      path: `${PRODUCTS_PATH}/${productId}`,
      body: product,
    }),
  }),
  defineTool({
    name: AgentToolName.UpdateProductText,
    title: 'Edit a product’s title or description',
    description:
      'Change only the catalog title and/or description of a product; variants, prices, stock ' +
      'and images stay as they are, and connected stores are updated. Prefer it to ' +
      'replace_product for copy edits. To change what one store shows, use update_listing.',
    input: {
      productId: ID_INPUT,
      title: z.string().min(1).max(PRODUCT_TITLE_MAX_LENGTH).optional(),
      descriptionHtml: z
        .string()
        .max(PRODUCT_DESCRIPTION_MAX_LENGTH)
        .optional()
        .describe('HTML; unsafe markup is removed'),
    },
    readOnly: false,
    overwrites: true,
    openWorld: true,
    scope: AgentScope.CatalogWrite,
    toCall: ({ productId, ...content }) => ({
      method: HttpMethod.Patch,
      path: `${PRODUCTS_PATH}/${productId}`,
      body: content,
    }),
  }),
  defineTool({
    name: AgentToolName.UpdateVariantPrice,
    title: 'Change a variant’s price',
    description:
      'Change only the catalog price and/or compare-at price of one variant; everything else ' +
      'stays as it is, and connected stores are updated. Prefer it to replace_product for price ' +
      'edits. Find the variantId with get_product. To change what one store charges, use ' +
      'update_listing.',
    input: {
      productId: ID_INPUT,
      variantId: ID_INPUT.describe('From get_product'),
      price: AMOUNT_INPUT.optional().describe('In the workspace currency'),
      compareAtPrice: AMOUNT_INPUT.nullable()
        .optional()
        .describe('The "was" price buyers see struck through; null removes it'),
    },
    readOnly: false,
    overwrites: true,
    openWorld: true,
    scope: AgentScope.CatalogWrite,
    priceInputs: ['price', 'compareAtPrice'],
    toCall: ({ productId, variantId, ...prices }) => ({
      method: HttpMethod.Patch,
      path: `${PRODUCTS_PATH}/${productId}/variants/${variantId}`,
      body: prices,
    }),
  }),
  defineTool({
    name: AgentToolName.MarkProductSold,
    title: 'Mark a product sold',
    description:
      'For a one-of-a-kind item that sold anywhere (in person, or on a store Crossmart does not ' +
      'manage): sets every variant’s available stock to 0 and takes the product off every ' +
      'connected store, so it cannot sell twice. Safe to repeat. Orders from connected stores ' +
      'are handled already; to sell only some units of a product, use adjust_stock instead.',
    input: { productId: ID_INPUT.describe('From list_products') },
    readOnly: false,
    destructive: true,
    openWorld: true,
    idempotent: true,
    scope: AgentScope.CatalogWrite,
    toCall: ({ productId }) => ({
      method: HttpMethod.Post,
      path: `${PRODUCTS_PATH}/${productId}/mark-sold`,
    }),
  }),
];
