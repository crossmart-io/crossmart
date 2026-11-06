import { z } from 'zod';
import { ChannelProductState } from '@crossmart/core/listings/enums/channel-product-state.enum.js';
import { HttpMethod } from '../api/api-call.js';
import {
  CATEGORY_ID_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_QUERY_MAX_LENGTH,
  ITEM_SPECIFIC_NAME_MAX_LENGTH,
  ITEM_SPECIFIC_VALUE_MAX_LENGTH,
  ITEM_SPECIFIC_VALUES_MAX,
  ITEM_SPECIFICS_MAX,
  RefusalStatus,
} from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { LISTING_STATE_GUIDE } from './listing-guidance.js';
import { productStorePath, productStoresPath, storePath } from './store-paths.js';
import { ID_INPUT, PAGE_INPUT, SEARCH_INPUT } from './tool-inputs.js';

/** Parts of a product-on-a-store path. */
const RETRY_PART = 'retry';
const ITEM_SPECIFICS_PART = 'item-specifics';
const CATEGORY_PART = 'category';
const CATEGORY_SUGGESTIONS_PART = 'category-suggestions';
const STORE_PRODUCTS_PART = 'products';

const PRODUCT_ON_STORE_INPUT = {
  productId: ID_INPUT,
  connectionId: ID_INPUT.describe('The store, from list_stores'),
};

const ITEM_SPECIFIC_INPUT = z.object({
  name: z.string().min(1).max(ITEM_SPECIFIC_NAME_MAX_LENGTH).describe('The aspect name'),
  values: z
    .array(z.string().max(ITEM_SPECIFIC_VALUE_MAX_LENGTH))
    .max(ITEM_SPECIFIC_VALUES_MAX)
    .describe('One value unless the aspect is `multiple`; empty removes it'),
});

const CATEGORY_INPUT = z.object({
  id: z.string().min(1).max(CATEGORY_ID_MAX_LENGTH),
  name: z.string().min(1).max(CATEGORY_NAME_MAX_LENGTH),
});

const STATE_TOOLS = [
  defineTool({
    name: 'list_store_products',
    title: 'List a store’s products by state',
    description:
      'The products a store should have or still has, with their state there, and counts per ' +
      'state. Use it to answer "which listings failed?" (state failed), "what is still being ' +
      'published?" (pending) or "what is not on this store?" (excluded). Products that need ' +
      'details before they can be published are pending with displayState needs_details. ' +
      LISTING_STATE_GUIDE,
    input: {
      connectionId: ID_INPUT.describe('The store, from list_stores'),
      state: z
        .enum(ChannelProductState)
        .optional()
        .describe('Leave out for listed, pending, failed and removing together'),
      search: SEARCH_INPUT.describe('Matches title, handle or SKU'),
      ...PAGE_INPUT,
    },
    readOnly: true,
    toCall: ({ connectionId, ...query }) => ({
      method: HttpMethod.Get,
      path: `${storePath(connectionId)}/${STORE_PRODUCTS_PART}`,
      query,
    }),
  }),
  defineTool({
    name: 'get_product_stores',
    title: 'Get a product on every store',
    description:
      'One product on each connected store: whether it is selected, its listing, channel ' +
      'prices, shown stock and overrides. ' +
      LISTING_STATE_GUIDE,
    input: { productId: ID_INPUT },
    readOnly: true,
    toCall: ({ productId }) => ({ method: HttpMethod.Get, path: productStoresPath(productId) }),
  }),
  defineTool({
    name: 'retry_store_listing',
    title: 'Retry publishing a product to a store',
    description:
      'Publish one product to one store again, after fixing what it lacked or when its last ' +
      'publish failed. The answer shows displayState publishing; the job runs in the ' +
      'background, so check it later with get_product_stores. Only this listing is sent.',
    input: PRODUCT_ON_STORE_INPUT,
    readOnly: false,
    refusalHints: {
      [RefusalStatus.Conflict]:
        'The store is not connected or does not select the product: check list_stores, or add ' +
        'it with add_product_to_store.',
      [RefusalStatus.PaymentRequired]:
        'The plan has no room for another active listing; the merchant must upgrade.',
    },
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Post,
      path: productStorePath(productId, connectionId, RETRY_PART),
    }),
  }),
];

const CATEGORY_TOOLS = [
  defineTool({
    name: 'suggest_store_categories',
    title: 'Suggest store categories for a product',
    description:
      'Categories on a store with a category tree (eBay) that fit the product, best first. ' +
      'Pass one to set_store_category. Searches the product’s title unless search is given.',
    input: {
      ...PRODUCT_ON_STORE_INPUT,
      search: z.string().max(CATEGORY_QUERY_MAX_LENGTH).optional().describe('Keywords'),
    },
    readOnly: true,
    toCall: ({ productId, connectionId, search }) => ({
      method: HttpMethod.Get,
      path: productStorePath(productId, connectionId, CATEGORY_SUGGESTIONS_PART),
      query: { search },
    }),
  }),
  defineTool({
    name: 'set_store_category',
    title: 'Set a product’s store category',
    description:
      'Choose the category a product is listed in on a store (eBay), from ' +
      'suggest_store_categories. Null lets the next publish pick the best match. The category ' +
      'decides which item specifics the listing needs: read them next with get_item_specifics.',
    input: { ...PRODUCT_ON_STORE_INPUT, category: CATEGORY_INPUT.nullable() },
    readOnly: false,
    toCall: ({ productId, connectionId, category }) => ({
      method: HttpMethod.Put,
      path: productStorePath(productId, connectionId, CATEGORY_PART),
      body: { category },
    }),
  }),
];

const ITEM_SPECIFICS_TOOLS = [
  defineTool({
    name: 'get_item_specifics',
    title: 'Get a listing’s item specifics',
    description:
      'The item specifics (eBay aspects such as Brand or Color) a product’s category on a ' +
      'store asks for, required first, then recommended, then optional, with the values set ' +
      'now. mode selection_only takes one of `values`; free_text takes any text. Empty until ' +
      'the listing has a category (see set_store_category). Use it when a listing needs ' +
      'item_specifics.',
    input: PRODUCT_ON_STORE_INPUT,
    readOnly: true,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Get,
      path: productStorePath(productId, connectionId, ITEM_SPECIFICS_PART),
    }),
  }),
  defineTool({
    name: 'save_item_specifics',
    title: 'Save a listing’s item specifics',
    description:
      'Replace a product’s item specifics on one store: specifics left out are removed, so ' +
      'send the ones from get_item_specifics you keep. Give every required aspect. A listing ' +
      'on the store, or one whose last publish failed, is sent again by itself.',
    input: {
      ...PRODUCT_ON_STORE_INPUT,
      itemSpecifics: z.array(ITEM_SPECIFIC_INPUT).max(ITEM_SPECIFICS_MAX),
    },
    readOnly: false,
    destructive: true,
    toCall: ({ productId, connectionId, itemSpecifics }) => ({
      method: HttpMethod.Put,
      path: productStorePath(productId, connectionId, ITEM_SPECIFICS_PART),
      body: { itemSpecifics },
    }),
  }),
];

/** A product's state on each store, and what it needs to be published there. */
export const LISTING_TOOLS = [...STATE_TOOLS, ...CATEGORY_TOOLS, ...ITEM_SPECIFICS_TOOLS];
