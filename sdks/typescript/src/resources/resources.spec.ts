import { describe, expect, it } from 'vitest';
import { Crossmart } from '../crossmart.js';
import {
  ContentField,
  InventoryMovementReason,
  ListingStatus,
  PriceRounding,
  CompareAtMode,
  SalesRange,
  StockAdjustmentMode,
} from '../generated/schema.js';
import {
  emptyResponse,
  jsonResponse,
  mockFetch,
  TEST_BASE_URL,
  WORKSPACE_ID,
} from '../testing/mock-fetch.js';

const PRODUCT_ID = 'product-1';
const CONNECTION_ID = 'store-1';
const ITEM_ID = 'item-1';
const ORDER_ID = 'order-1';
const SUGGESTION_ID = 'suggestion-1';
const WORKSPACE = `/api/v1/workspaces/${WORKSPACE_ID}`;
const PRICING_RULE = {
  adjustmentPercent: '10',
  fixedAmount: '0',
  rounding: PriceRounding.ending_99,
  floor: null,
  compareAt: CompareAtMode.adjust,
};

interface RouteCase {
  name: string;
  call: (crossmart: Crossmart) => Promise<unknown>;
  method: string;
  path: string;
  body?: unknown;
  status?: number;
}

const ROUTES: RouteCase[] = [
  {
    name: 'products.list',
    call: (cm) => cm.products.list(),
    method: 'GET',
    path: `${WORKSPACE}/products`,
  },
  {
    name: 'products.get',
    call: (cm) => cm.products.get(PRODUCT_ID),
    method: 'GET',
    path: `${WORKSPACE}/products/${PRODUCT_ID}`,
  },
  {
    name: 'products.create',
    call: (cm) => cm.products.create({ title: 'Mug', variants: [{ price: '18.00' }] }),
    method: 'POST',
    path: `${WORKSPACE}/products`,
    body: { title: 'Mug', variants: [{ price: '18.00' }] },
  },
  {
    name: 'products.update',
    call: (cm) => cm.products.update(PRODUCT_ID, { title: 'Mug', handle: 'mug', variants: [] }),
    method: 'PUT',
    path: `${WORKSPACE}/products/${PRODUCT_ID}`,
    body: { title: 'Mug', handle: 'mug', variants: [] },
  },
  {
    name: 'products.delete',
    call: (cm) => cm.products.delete(PRODUCT_ID),
    method: 'DELETE',
    path: `${WORKSPACE}/products/${PRODUCT_ID}`,
    status: 204,
  },
  {
    name: 'inventory.list',
    call: (cm) => cm.inventory.list(),
    method: 'GET',
    path: `${WORKSPACE}/inventory-items`,
  },
  {
    name: 'inventory.adjust',
    call: (cm) =>
      cm.inventory.adjust(ITEM_ID, {
        mode: StockAdjustmentMode.delta,
        quantity: 5,
        reason: InventoryMovementReason.RECEIVED,
      }),
    method: 'POST',
    path: `${WORKSPACE}/inventory-items/${ITEM_ID}/adjustments`,
    body: { mode: 'delta', quantity: 5, reason: 'RECEIVED' },
  },
  {
    name: 'inventory.listMovements',
    call: (cm) => cm.inventory.listMovements(ITEM_ID),
    method: 'GET',
    path: `${WORKSPACE}/inventory-items/${ITEM_ID}/movements`,
  },
  {
    name: 'stores.list',
    call: (cm) => cm.stores.list(),
    method: 'GET',
    path: `${WORKSPACE}/channel-connections`,
  },
  {
    name: 'stores.get',
    call: (cm) => cm.stores.get(CONNECTION_ID),
    method: 'GET',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}`,
  },
  {
    name: 'stores.updatePricing',
    call: (cm) => cm.stores.updatePricing(CONNECTION_ID, PRICING_RULE),
    method: 'PUT',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/pricing`,
    body: { rule: PRICING_RULE },
  },
  {
    name: 'stores.previewPricing',
    call: (cm) =>
      cm.stores.previewPricing(CONNECTION_ID, { rule: PRICING_RULE, productId: PRODUCT_ID }),
    method: 'POST',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/pricing/preview`,
    body: { rule: PRICING_RULE, productId: PRODUCT_ID },
  },
  {
    name: 'stores.sync',
    call: (cm) => cm.stores.sync(CONNECTION_ID),
    method: 'POST',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/sync`,
  },
  {
    name: 'listings.forProduct',
    call: (cm) => cm.listings.forProduct(PRODUCT_ID),
    method: 'GET',
    path: `${WORKSPACE}/products/${PRODUCT_ID}/channels`,
  },
  {
    name: 'listings.publish',
    call: (cm) => cm.listings.publish(PRODUCT_ID, CONNECTION_ID),
    method: 'POST',
    path: `${WORKSPACE}/products/${PRODUCT_ID}/channels/${CONNECTION_ID}`,
  },
  {
    name: 'listings.remove',
    call: (cm) => cm.listings.remove(PRODUCT_ID, CONNECTION_ID),
    method: 'DELETE',
    path: `${WORKSPACE}/products/${PRODUCT_ID}/channels/${CONNECTION_ID}`,
  },
  {
    name: 'listings.publishMany',
    call: (cm) => cm.listings.publishMany(CONNECTION_ID, [PRODUCT_ID]),
    method: 'POST',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/products/add`,
    body: { productIds: [PRODUCT_ID] },
  },
  {
    name: 'listings.removeMany',
    call: (cm) => cm.listings.removeMany(CONNECTION_ID, [PRODUCT_ID]),
    method: 'POST',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/products/remove`,
    body: { productIds: [PRODUCT_ID] },
  },
  {
    name: 'listings.setOverride',
    call: (cm) => cm.listings.setOverride(PRODUCT_ID, CONNECTION_ID, { title: 'Store title' }),
    method: 'PUT',
    path: `${WORKSPACE}/products/${PRODUCT_ID}/channels/${CONNECTION_ID}/override`,
    body: { title: 'Store title' },
  },
  {
    name: 'listings.clearOverride',
    call: (cm) => cm.listings.clearOverride(PRODUCT_ID, CONNECTION_ID),
    method: 'DELETE',
    path: `${WORKSPACE}/products/${PRODUCT_ID}/channels/${CONNECTION_ID}/override`,
  },
  {
    name: 'listings.list',
    call: (cm) => cm.listings.list(CONNECTION_ID, { status: ListingStatus.ERROR }),
    method: 'GET',
    path: `${WORKSPACE}/channel-connections/${CONNECTION_ID}/listings?status=ERROR`,
  },
  {
    name: 'orders.list',
    call: (cm) => cm.orders.list(),
    method: 'GET',
    path: `${WORKSPACE}/orders`,
  },
  {
    name: 'orders.get',
    call: (cm) => cm.orders.get(ORDER_ID),
    method: 'GET',
    path: `${WORKSPACE}/orders/${ORDER_ID}`,
  },
  {
    name: 'reports.sales',
    call: (cm) => cm.reports.sales({ range: SalesRange.last_7_days }),
    method: 'GET',
    path: `${WORKSPACE}/analytics/sales?range=last_7_days`,
  },
  {
    name: 'reports.inventory',
    call: (cm) => cm.reports.inventory(),
    method: 'GET',
    path: `${WORKSPACE}/analytics/inventory`,
  },
  {
    name: 'ai.status',
    call: (cm) => cm.ai.status(),
    method: 'GET',
    path: `${WORKSPACE}/ai/status`,
  },
  { name: 'ai.usage', call: (cm) => cm.ai.usage(), method: 'GET', path: `${WORKSPACE}/ai/usage` },
  {
    name: 'ai.generateContent',
    call: (cm) => cm.ai.generateContent({ connectionId: CONNECTION_ID, productIds: [PRODUCT_ID] }),
    method: 'POST',
    path: `${WORKSPACE}/ai/content-generations`,
    body: { connectionId: CONNECTION_ID, productIds: [PRODUCT_ID] },
  },
  {
    name: 'ai.draftContent',
    call: (cm) => cm.ai.draftContent({ productId: PRODUCT_ID, fields: [ContentField.title] }),
    method: 'POST',
    path: `${WORKSPACE}/ai/content-drafts`,
    body: { productId: PRODUCT_ID, fields: ['title'] },
  },
  {
    name: 'suggestions.list',
    call: (cm) => cm.suggestions.list(),
    method: 'GET',
    path: `${WORKSPACE}/suggestions`,
  },
  {
    name: 'suggestions.get',
    call: (cm) => cm.suggestions.get(SUGGESTION_ID),
    method: 'GET',
    path: `${WORKSPACE}/suggestions/${SUGGESTION_ID}`,
  },
  {
    name: 'suggestions.approve',
    call: (cm) => cm.suggestions.approve(SUGGESTION_ID),
    method: 'POST',
    path: `${WORKSPACE}/suggestions/${SUGGESTION_ID}/approve`,
  },
  {
    name: 'suggestions.reject',
    call: (cm) => cm.suggestions.reject(SUGGESTION_ID),
    method: 'POST',
    path: `${WORKSPACE}/suggestions/${SUGGESTION_ID}/reject`,
  },
  {
    name: 'suggestions.approveMany',
    call: (cm) => cm.suggestions.approveMany([SUGGESTION_ID]),
    method: 'POST',
    path: `${WORKSPACE}/suggestions/bulk-approve`,
    body: { suggestionIds: [SUGGESTION_ID] },
  },
  { name: 'workspaces.get', call: (cm) => cm.workspaces.get(), method: 'GET', path: WORKSPACE },
  {
    name: 'workspaces.update',
    call: (cm) => cm.workspaces.update({ timeZone: 'Europe/Berlin' }),
    method: 'PATCH',
    path: WORKSPACE,
    body: { timeZone: 'Europe/Berlin' },
  },
  {
    name: 'workspaces.currentApiKey',
    call: (cm) => cm.workspaces.currentApiKey(),
    method: 'GET',
    path: '/api/v1/api-key',
  },
];

describe('resources', () => {
  it.each(ROUTES)('$name calls $method $path', async ({ call, method, path, body, status }) => {
    const responseBody = { id: 'response' };
    const { fetch, requests } = mockFetch(() =>
      status === undefined ? jsonResponse(responseBody) : emptyResponse(status),
    );
    const crossmart = new Crossmart(
      { apiKey: 'key' },
      { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
    );

    const result = await call(crossmart);

    const request = requests[0];
    expect(request?.method).toBe(method);
    expect(request?.url).toBe(`${TEST_BASE_URL}${path}`);
    const sentBody = (await request?.text()) ?? '';
    expect(sentBody === '' ? undefined : JSON.parse(sentBody)).toEqual(body);
    expect(result).toEqual(status === undefined ? responseBody : undefined);
  });
});
