import { HttpMethod } from '../api/api-call.js';
import { defineTool } from './api-tool.js';
import { productStorePath, STORES_PATH, storePath } from './store-paths.js';
import { ID_INPUT } from './tool-inputs.js';

const SYNC_PART = 'sync';

const PUBLISH_READINESS_GUIDE =
  'publishReadiness.ready is false while the store’s setup blocks every listing; ' +
  'publishReadiness.missing lists what to finish, in order (such as shipping_policy or ' +
  'ship_from_location on eBay, listing_setup on Google, reconnect when the store must be ' +
  'connected again). Only the merchant can finish it, in the Crossmart dashboard: tell them ' +
  'what is missing.';

export const STORE_TOOLS = [
  defineTool({
    name: 'list_stores',
    title: 'List stores',
    description:
      'Connected stores (Shopify, eBay, Google) with their status, listing counts, failed ' +
      `listings and publish readiness. ${PUBLISH_READINESS_GUIDE} Connecting a store needs ` +
      'the merchant’s own approval in the Crossmart app.',
    input: {},
    readOnly: true,
    toCall: () => ({ method: HttpMethod.Get, path: STORES_PATH }),
  }),
  defineTool({
    name: 'get_store',
    title: 'Get a store',
    description:
      'One connected store with its status, settings and publish readiness. Use it to tell ' +
      `the merchant what setup a store still needs before it can publish. ${PUBLISH_READINESS_GUIDE}`,
    input: { connectionId: ID_INPUT.describe('From list_stores') },
    readOnly: true,
    toCall: ({ connectionId }) => ({ method: HttpMethod.Get, path: storePath(connectionId) }),
  }),
  defineTool({
    name: 'get_sync_progress',
    title: 'Get a store’s sync progress',
    description:
      'How far a store’s sync has come: pending counts the listings a sync or retry queued ' +
      'whose publish, update or delist has not finished, failed counts the store’s listings in ' +
      'error, and done is true once nothing is pending. Poll it after retry_store_listing or ' +
      'a sync the merchant started; on failures, list them with list_store_products (state ' +
      'failed).',
    input: { connectionId: ID_INPUT.describe('From list_stores') },
    readOnly: true,
    toCall: ({ connectionId }) => ({
      method: HttpMethod.Get,
      path: `${storePath(connectionId)}/${SYNC_PART}`,
    }),
  }),
  defineTool({
    name: 'add_product_to_store',
    title: 'Add a product to a store',
    description:
      'List a product on a connected store. Crossmart publishes it and keeps it in sync. The ' +
      'answer shows its displayState there; on needs_details, see get_product_stores.',
    input: { productId: ID_INPUT, connectionId: ID_INPUT.describe('From list_stores') },
    readOnly: false,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Post,
      path: productStorePath(productId, connectionId),
    }),
  }),
  defineTool({
    name: 'remove_product_from_store',
    title: 'Remove a product from a store',
    description: 'Take a product off a store. It is archived there and keeps its order history.',
    input: { productId: ID_INPUT, connectionId: ID_INPUT },
    readOnly: false,
    destructive: true,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Delete,
      path: productStorePath(productId, connectionId),
    }),
  }),
];
