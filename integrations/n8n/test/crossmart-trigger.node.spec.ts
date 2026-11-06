import type { IDataObject, INodeType } from 'n8n-workflow';
import { beforeEach, describe, expect, it } from 'vitest';
import { CrossmartPollingTrigger } from '../nodes/CrossmartPollingTrigger/CrossmartPollingTrigger.node';
import { CrossmartTrigger } from '../nodes/CrossmartTrigger/CrossmartTrigger.node';
import { FakeApi, WORKSPACE_URL } from './support/fake-api';
import { fakePollFunctions } from './support/fake-context';

const ORDERS_URL = `${WORKSPACE_URL}/orders`;
const INVENTORY_URL = `${WORKSPACE_URL}/inventory-items`;
const STORES_URL = `${WORKSPACE_URL}/channel-connections`;

const order = (id: string): IDataObject => ({
	id,
	name: `#${id}`,
	placedAt: '2026-11-01T10:00:00.000Z',
});
const stock = (id: string, updatedAt: string): IDataObject => ({
	inventoryItemId: id,
	updatedAt,
	available: 3,
});

/** Both nodes that poll: version 1 of the Crossmart Trigger, and the Crossmart Polling Trigger. */
const POLLING_NODES: Array<[string, INodeType]> = [
	['Crossmart Trigger v1', new CrossmartTrigger().getNodeType(1)],
	['Crossmart Polling Trigger', new CrossmartPollingTrigger()],
];

async function pollWith(
	nodeType: INodeType,
	api: FakeApi,
	parameters: IDataObject,
	staticData: IDataObject,
	mode: 'trigger' | 'manual' = 'trigger',
): Promise<IDataObject[] | null> {
	if (nodeType.poll === undefined) throw new Error('The node does not poll');
	const result = await nodeType.poll.call(fakePollFunctions(api, parameters, staticData, mode));
	return result === null ? null : result[0].map((item) => item.json);
}

describe.each(POLLING_NODES)('%s', (_name, nodeType) => {
	const poll = (...args: [FakeApi, IDataObject, IDataObject, ('trigger' | 'manual')?]) =>
		pollWith(nodeType, ...args);
	let api: FakeApi;
	let staticData: IDataObject;

	beforeEach(() => {
		api = new FakeApi();
		staticData = {};
	});

	describe('new order', () => {
		const parameters = { event: 'newOrder' };

		it('starts from the current orders without emitting them', async () => {
			api.onPages(ORDERS_URL, [[order('o2'), order('o1')]]);

			expect(await poll(api, parameters, staticData)).toBeNull();
			expect(staticData.seenIds).toEqual(['o2', 'o1']);
		});

		it('emits only new orders, oldest first, once', async () => {
			api.onPages(ORDERS_URL, [[order('o2'), order('o1')]]);
			await poll(api, parameters, staticData);

			api.onPages(ORDERS_URL, [[order('o4'), order('o3'), order('o2'), order('o1')]]);
			const emitted = await poll(api, parameters, staticData);
			const again = await poll(api, parameters, staticData);

			expect(emitted?.map((item) => item.id)).toEqual(['o3', 'o4']);
			expect(again).toBeNull();
		});

		it('reads further pages while every order on a page is new', async () => {
			api.onPages(ORDERS_URL, [[order('o1')]]);
			await poll(api, parameters, staticData);

			api.onPages(ORDERS_URL, [[order('o3')], [order('o2')], [order('o1')]]);
			const emitted = await poll(api, parameters, staticData);

			expect(emitted?.map((item) => item.id)).toEqual(['o2', 'o3']);
		});

		it('filters by store and lists newest first', async () => {
			api.onPages(ORDERS_URL, [[]]);

			await poll(api, { ...parameters, connectionId: 'store-1' }, staticData);

			expect(api.apiRequests[0].qs).toMatchObject({ connectionId: 'store-1', direction: 'desc' });
		});

		it('returns the latest order in a manual run, without changing the state', async () => {
			api.onPages(ORDERS_URL, [[order('o9')]]);

			const sample = await poll(api, parameters, staticData, 'manual');

			expect(sample).toEqual([order('o9')]);
			expect(staticData).toEqual({});
		});
	});

	describe('stock changed', () => {
		const parameters = { event: 'stockChanged' };
		const T1 = '2026-11-01T10:00:00.000Z';
		const T2 = '2026-11-01T10:05:00.000Z';
		const T3 = '2026-11-01T10:09:00.000Z';

		it('emits items updated after the watermark, and moves it', async () => {
			api.onPages(INVENTORY_URL, [[stock('i1', T1)]]);
			expect(await poll(api, parameters, staticData)).toBeNull();

			api.onPages(INVENTORY_URL, [[stock('i3', T3), stock('i2', T2), stock('i1', T1)]]);
			const emitted = await poll(api, parameters, staticData);

			expect(emitted?.map((item) => item.inventoryItemId)).toEqual(['i2', 'i3']);
			expect(staticData).toMatchObject({ watermark: T3, idsAtWatermark: ['i3'] });
			expect(api.apiRequests.slice(-1)[0].qs).toMatchObject({
				sort: 'updated_at',
				direction: 'desc',
			});
		});

		it('emits an item again when its stock changes again', async () => {
			api.onPages(INVENTORY_URL, [[stock('i1', T1)]]);
			await poll(api, parameters, staticData);

			api.onPages(INVENTORY_URL, [[stock('i1', T2)]]);

			expect(await poll(api, parameters, staticData)).toEqual([stock('i1', T2)]);
			expect(await poll(api, parameters, staticData)).toBeNull();
		});
	});

	describe('listing failed', () => {
		const parameters = { event: 'listingFailed' };
		const stores = [
			{ id: 'store-1', displayName: 'Shop', channel: 'shopify', failedListings: 1 },
			{ id: 'store-2', displayName: 'eBay', channel: 'ebay', failedListings: 0 },
		];
		const failed = (id: string, lastError: string): IDataObject => ({
			id,
			productId: `p-${id}`,
			status: 'ERROR',
			lastError,
		});

		beforeEach(() => {
			api.on('GET', STORES_URL, () => stores);
		});

		it('emits listings that started failing, with their store', async () => {
			api.onPages(`${STORES_URL}/store-1/listings`, [[failed('l1', 'Missing brand')]]);
			expect(await poll(api, parameters, staticData)).toBeNull();

			api.onPages(`${STORES_URL}/store-1/listings`, [
				[failed('l1', 'Missing brand'), failed('l2', 'Price too low')],
			]);
			const emitted = await poll(api, parameters, staticData);

			expect(emitted).toEqual([
				{
					...failed('l2', 'Price too low'),
					connectionId: 'store-1',
					storeName: 'Shop',
					channel: 'shopify',
				},
			]);
		});

		it('reads only the stores that report failed listings, filtered by status', async () => {
			api.onPages(`${STORES_URL}/store-1/listings`, [[]]);

			await poll(api, parameters, staticData);

			const listingRequests = api.apiRequests.filter((request) =>
				request.url.endsWith('/listings'),
			);
			expect(listingRequests).toHaveLength(1);
			expect(listingRequests[0].qs).toMatchObject({ status: 'ERROR' });
		});

		it('emits a listing again when it fails after recovering', async () => {
			api.onPages(`${STORES_URL}/store-1/listings`, [[failed('l1', 'Missing brand')]]);
			await poll(api, parameters, staticData);
			api.onPages(`${STORES_URL}/store-1/listings`, [[]]);
			await poll(api, parameters, staticData);
			api.onPages(`${STORES_URL}/store-1/listings`, [[failed('l1', 'Missing brand')]]);

			expect(await poll(api, parameters, staticData)).toHaveLength(1);
		});
	});
});
