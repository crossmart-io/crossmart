import type { IDataObject } from 'n8n-workflow';
import { beforeEach, describe, expect, it } from 'vitest';
import { Crossmart } from '../nodes/Crossmart/Crossmart.node';
import { FakeApi, WORKSPACE_URL } from './support/fake-api';
import { fakeExecuteFunctions } from './support/fake-context';

const PRODUCT = {
	id: 'prod-1',
	handle: 'mug',
	title: 'Mug',
	descriptionHtml: '<p>Mug</p>',
	vendor: null,
	productType: null,
	tags: ['kitchen'],
	status: 'ACTIVE',
	optionNames: ['Size'],
	media: [{ id: 'media-1', url: 'https://cdn.test/mug.jpg', altText: null, position: 0 }],
	variants: [
		{
			id: 'var-1',
			position: 0,
			sku: 'MUG-S',
			barcode: null,
			optionValues: ['S'],
			price: '18.00',
			compareAtPrice: null,
			cost: null,
			weightGrams: null,
			requiresShipping: true,
			taxable: true,
			outOfStockPolicy: 'STOP_SELLING',
			tracked: true,
			available: 7,
		},
	],
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
};

async function run(api: FakeApi, ...parametersPerItem: IDataObject[]): Promise<IDataObject[]> {
	const [items] = await new Crossmart().execute.call(fakeExecuteFunctions(api, parametersPerItem));
	return items.map((item) => item.json);
}

describe('Crossmart node', () => {
	let api: FakeApi;

	beforeEach(() => {
		api = new FakeApi();
	});

	it('finds the workspace once per execution, from the API key', async () => {
		api.on('GET', `${WORKSPACE_URL}/products/prod-1`, () => PRODUCT);

		const parameters = { resource: 'product', operation: 'get', productId: 'prod-1' };
		await run(api, parameters, parameters);

		expect(api.requests.filter((request) => request.url.endsWith('/api-key'))).toHaveLength(1);
		expect(api.apiRequests).toHaveLength(2);
	});

	it('creates a product with its variants and leaves unset fields out', async () => {
		api.on('POST', `${WORKSPACE_URL}/products`, (request) => ({
			id: 'prod-2',
			...(request.body as IDataObject),
		}));

		await run(api, {
			resource: 'product',
			operation: 'create',
			title: 'Mug',
			variants: {
				variant: [
					{ sku: 'MUG-S', price: '18.00', quantity: 25, optionValues: 'S', compareAtPrice: '' },
				],
			},
			additionalFields: { status: 'ACTIVE', tags: 'kitchen, gift' },
		});

		expect(api.apiRequests[0].body).toEqual({
			title: 'Mug',
			status: 'ACTIVE',
			tags: ['kitchen', 'gift'],
			variants: [{ sku: 'MUG-S', price: '18.00', quantity: 25, optionValues: ['S'] }],
		});
	});

	it('updates a product by sending it whole, keeping variants and stock', async () => {
		api.on('GET', `${WORKSPACE_URL}/products/prod-1`, () => PRODUCT);
		api.on('PUT', `${WORKSPACE_URL}/products/prod-1`, () => PRODUCT);

		await run(api, {
			resource: 'product',
			operation: 'update',
			productId: 'prod-1',
			updateFields: { title: 'Large mug', tags: 'kitchen, sale' },
		});

		const body = api.apiRequests[1].body as IDataObject;
		expect(body).toMatchObject({
			title: 'Large mug',
			handle: 'mug',
			tags: ['kitchen', 'sale'],
			status: 'ACTIVE',
			media: [{ url: 'https://cdn.test/mug.jpg' }],
		});
		expect(body.variants).toEqual([
			expect.objectContaining({ id: 'var-1', sku: 'MUG-S', price: '18.00', optionValues: ['S'] }),
		]);
		expect(body.variants).toEqual([expect.not.objectContaining({ quantity: expect.anything() })]);
	});

	it('pages through every product when Return All is on', async () => {
		api.onPages(`${WORKSPACE_URL}/products`, [[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]]);

		const products = await run(api, {
			resource: 'product',
			operation: 'getMany',
			returnAll: true,
			filters: { status: 'ACTIVE', tags: 'mug' },
		});

		expect(products.map((product) => product.id)).toEqual(['a', 'b', 'c']);
		expect(api.apiRequests[0].qs).toEqual({ status: 'ACTIVE', tags: ['mug'], limit: 100 });
		expect(api.apiRequests[1].qs).toMatchObject({ cursor: '1' });
	});

	it('asks only for the Limit when Return All is off', async () => {
		api.onPages(`${WORKSPACE_URL}/orders`, [[{ id: 'o1' }, { id: 'o2' }]]);

		await run(api, {
			resource: 'order',
			operation: 'getMany',
			returnAll: false,
			limit: 2,
			filters: {},
		});

		expect(api.apiRequests).toHaveLength(1);
		expect(api.apiRequests[0].qs).toEqual({ limit: 2 });
	});

	it('adjusts stock with the mode, quantity, reason and note', async () => {
		api.on('POST', `${WORKSPACE_URL}/inventory-items/inv-1/adjustments`, () => ({ available: 19 }));

		await run(api, {
			resource: 'inventory',
			operation: 'adjust',
			inventoryItemId: 'inv-1',
			mode: 'delta',
			quantity: 12,
			reason: 'RECEIVED',
			additionalFields: { note: 'PO 1042' },
		});

		expect(api.apiRequests[0].body).toEqual({
			mode: 'delta',
			quantity: 12,
			reason: 'RECEIVED',
			note: 'PO 1042',
		});
	});

	it('gets stock by exact SKU only', async () => {
		api.onPages(`${WORKSPACE_URL}/inventory-items`, [[{ sku: 'MUG-S' }, { sku: 'MUG-S-2' }]]);

		const items = await run(api, { resource: 'inventory', operation: 'getBySku', sku: ' MUG-S ' });

		expect(items).toEqual([{ sku: 'MUG-S' }]);
		expect(api.apiRequests[0].qs).toMatchObject({ search: 'MUG-S' });
	});

	it.each([
		['publish', 'POST', '/products/prod-1/channels/store-1'],
		['retry', 'POST', '/products/prod-1/channels/store-1/retry'],
		['unpublish', 'DELETE', '/products/prod-1/channels/store-1'],
	])('%s calls %s %s', async (operation, method, path) => {
		api.on(method, `${WORKSPACE_URL}${path}`, () => ({ displayState: 'publishing' }));

		await run(api, {
			resource: 'listing',
			operation,
			productId: 'prod-1',
			connectionId: 'store-1',
		});

		expect(api.apiRequests[0]).toMatchObject({ method, url: `${WORKSPACE_URL}${path}` });
	});

	it('splits a product’s per-store state into one item per store', async () => {
		api.on('GET', `${WORKSPACE_URL}/products/prod-1/channels`, () => [
			{ selected: true },
			{ selected: false },
		]);

		const items = await run(api, {
			resource: 'listing',
			operation: 'getForProduct',
			productId: 'prod-1',
		});

		expect(items).toHaveLength(2);
	});

	it.each([
		['sync', 'POST'],
		['getSyncProgress', 'GET'],
	])('store %s calls %s …/sync', async (operation, method) => {
		api.on(method, `${WORKSPACE_URL}/channel-connections/store-1/sync`, () => ({ done: true }));

		const [result] = await run(api, { resource: 'store', operation, connectionId: 'store-1' });

		expect(result).toEqual({ done: true });
	});

	it('reports a failed item instead of stopping when Continue On Fail is on', async () => {
		const context = fakeExecuteFunctions(
			api,
			[{ resource: 'order', operation: 'get', orderId: 'missing' }],
			{
				continueOnFail: true,
			},
		);

		const [items] = await new Crossmart().execute.call(context);

		expect(items).toEqual([{ json: { error: expect.any(String) }, pairedItem: { item: 0 } }]);
	});

	it('rejects an unknown operation', async () => {
		await expect(run(api, { resource: 'product', operation: 'explode' })).rejects.toThrow(
			'The operation "explode" is not supported for "product"',
		);
	});
});
