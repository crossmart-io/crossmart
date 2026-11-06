import { createHmac } from 'node:crypto';
import type { IDataObject, INodeType, IWebhookResponseData } from 'n8n-workflow';
import { beforeEach, describe, expect, it } from 'vitest';
import { CrossmartTrigger } from '../nodes/CrossmartTrigger/CrossmartTrigger.node';
import { FakeApi, WORKSPACE_URL } from './support/fake-api';
import {
	FakeResponse,
	fakeHookFunctions,
	fakeWebhookFunctions,
	WEBHOOK_URL,
} from './support/fake-context';

const ENDPOINTS_URL = `${WORKSPACE_URL}/webhook-endpoints`;
const SECRET = 'whsec_example_n8n';
const PARAMETERS = { events: ['order.created', 'inventory.stock_changed'] };

const trigger: INodeType = new CrossmartTrigger().getNodeType(2);

const endpoint = (overrides: IDataObject = {}): IDataObject => ({
	id: 'we-1',
	url: WEBHOOK_URL,
	description: 'n8n workflow Orders to Sheets (wf-1)',
	eventTypes: ['order.created', 'inventory.stock_changed'],
	enabled: true,
	disabledReason: null,
	consecutiveFailures: 0,
	...overrides,
});

type LifecycleMethod = 'checkExists' | 'create' | 'delete';

async function lifecycle(
	method: LifecycleMethod,
	api: FakeApi,
	staticData: IDataObject,
	parameters: IDataObject = PARAMETERS,
): Promise<boolean> {
	const methods = trigger.webhookMethods?.default;
	if (methods === undefined) throw new Error('The trigger has no webhook lifecycle');
	return methods[method].call(fakeHookFunctions(api, parameters, staticData));
}

describe('Crossmart Trigger v2 (webhook)', () => {
	let api: FakeApi;
	let staticData: IDataObject;

	beforeEach(() => {
		api = new FakeApi();
		staticData = {};
	});

	it('is the default version, and receives webhooks instead of polling', () => {
		const versioned = new CrossmartTrigger();
		expect(versioned.getNodeType()).toBeInstanceOf(trigger.constructor);
		expect(trigger.poll).toBeUndefined();
		expect(trigger.description.webhooks).toHaveLength(1);
		expect(versioned.getNodeType(1).description.polling).toBe(true);
	});

	describe('create', () => {
		beforeEach(() => {
			api.on('POST', ENDPOINTS_URL, () => ({ endpoint: endpoint(), secret: SECRET }));
		});

		it('creates an endpoint for the webhook URL and stores its id and secret', async () => {
			expect(await lifecycle('create', api, staticData)).toBe(true);

			expect(api.apiRequests[0].body).toEqual({
				url: WEBHOOK_URL,
				eventTypes: ['order.created', 'inventory.stock_changed'],
				description: 'n8n workflow Orders to Sheets (wf-1)',
			});
			expect(staticData).toEqual({ endpointId: 'we-1', secret: SECRET });
		});

		it('deletes the endpoint it created before, so none is left behind', async () => {
			staticData.endpointId = 'we-old';
			staticData.secret = 'whsec_old';
			api.on('DELETE', `${ENDPOINTS_URL}/we-old`, () => undefined);

			await lifecycle('create', api, staticData);

			expect(api.apiRequests.map((request) => request.method)).toEqual(['DELETE', 'POST']);
			expect(staticData).toEqual({ endpointId: 'we-1', secret: SECRET });
		});

		it('refuses to create an endpoint without events', async () => {
			await expect(lifecycle('create', api, staticData, { events: [] })).rejects.toThrow(
				'Choose at least one event',
			);
			expect(api.apiRequests).toHaveLength(0);
		});

		it.each([
			['403', 'The API key needs the webhooks:manage permission (ADMIN role)'],
			['402', 'limit of webhook endpoints'],
			['400', 'Crossmart rejected this n8n webhook URL'],
		])('explains a %s answer', async (httpCode, message) => {
			api.onError('POST', ENDPOINTS_URL, httpCode);

			await expect(lifecycle('create', api, staticData)).rejects.toThrow(message);
			expect(staticData).toEqual({});
		});
	});

	describe('checkExists', () => {
		beforeEach(() => {
			staticData.endpointId = 'we-1';
			staticData.secret = SECRET;
		});

		it('is true when the stored endpoint matches the URL and the events', async () => {
			api.on('GET', `${ENDPOINTS_URL}/we-1`, () => endpoint());

			expect(await lifecycle('checkExists', api, staticData)).toBe(true);
		});

		it('is false without a stored endpoint, without asking the API', async () => {
			expect(await lifecycle('checkExists', api, {})).toBe(false);
			expect(api.requests).toHaveLength(0);
		});

		it('is false when the endpoint is gone', async () => {
			api.onError('GET', `${ENDPOINTS_URL}/we-1`, '404');

			expect(await lifecycle('checkExists', api, staticData)).toBe(false);
		});

		it.each([
			['another URL', { url: 'https://old-n8n.example.test/webhook/hook-1/webhook' }],
			['other events', { eventTypes: ['order.created'] }],
			['a disabled endpoint', { enabled: false, disabledReason: 'FAILING' }],
		])('is false for %s', async (_case, overrides) => {
			api.on('GET', `${ENDPOINTS_URL}/we-1`, () => endpoint(overrides));

			expect(await lifecycle('checkExists', api, staticData)).toBe(false);
		});

		it('passes on other errors', async () => {
			api.onError('GET', `${ENDPOINTS_URL}/we-1`, '500');

			await expect(lifecycle('checkExists', api, staticData)).rejects.toThrow();
		});
	});

	describe('delete', () => {
		beforeEach(() => {
			staticData.endpointId = 'we-1';
			staticData.secret = SECRET;
			staticData.recentEventIds = ['evt_1'];
		});

		it('deletes the endpoint and forgets it', async () => {
			api.on('DELETE', `${ENDPOINTS_URL}/we-1`, () => undefined);

			expect(await lifecycle('delete', api, staticData)).toBe(true);
			expect(api.apiRequests[0].method).toBe('DELETE');
			expect(staticData).toEqual({});
		});

		it('treats an endpoint that is already gone as deleted', async () => {
			api.onError('DELETE', `${ENDPOINTS_URL}/we-1`, '404');

			expect(await lifecycle('delete', api, staticData)).toBe(true);
			expect(staticData).toEqual({});
		});

		it('does nothing without a stored endpoint', async () => {
			expect(await lifecycle('delete', api, {})).toBe(true);
			expect(api.requests).toHaveLength(0);
		});
	});
});

describe('Crossmart Trigger v2 deliveries', () => {
	let staticData: IDataObject;
	let response: FakeResponse;

	const envelope = (type: string, id = 'evt_1'): IDataObject => ({
		id,
		type,
		createdAt: '2026-11-06T10:00:00.000Z',
		workspaceId: 'ws-1',
		apiVersion: 'v1',
		data: { order: { id: 'ord-1', name: '#1001', total: '42.00' } },
	});

	const signedHeaders = (rawBody: Buffer, secret: string = SECRET): Record<string, string> => {
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = createHmac('sha256', secret)
			.update(`${timestamp}.`)
			.update(rawBody)
			.digest('hex');
		return { 'crossmart-signature': `t=${timestamp},v1=${signature}` };
	};

	async function deliver(
		body: IDataObject,
		headersOf: (rawBody: Buffer) => Record<string, string> = signedHeaders,
	): Promise<IWebhookResponseData> {
		if (trigger.webhook === undefined) throw new Error('The trigger has no webhook');
		const rawBody = Buffer.from(JSON.stringify(body));
		const context = fakeWebhookFunctions(
			PARAMETERS,
			staticData,
			{ headers: headersOf(rawBody), rawBody },
			response,
		);
		return trigger.webhook.call(context);
	}

	beforeEach(() => {
		staticData = { endpointId: 'we-1', secret: SECRET };
		response = new FakeResponse();
	});

	it('starts the workflow with the whole event envelope', async () => {
		const result = await deliver(envelope('order.created'));

		expect(result).toEqual({ workflowData: [[{ json: envelope('order.created') }]] });
	});

	it('always passes test events through', async () => {
		const result = await deliver(envelope('webhook.test'));

		expect(result.workflowData?.[0][0].json.type).toBe('webhook.test');
	});

	it('answers events the user did not choose without starting the workflow', async () => {
		const result = await deliver(envelope('product.deleted'));

		expect(result.workflowData).toBeUndefined();
		expect(result.webhookResponse).toBeDefined();
	});

	it('drops an event that is delivered again', async () => {
		await deliver(envelope('order.created', 'evt_7'));
		const again = await deliver(envelope('order.created', 'evt_7'));

		expect(again.workflowData).toBeUndefined();
		expect(staticData.recentEventIds).toEqual(['evt_7']);
	});

	it.each([
		['a missing signature', () => ({})],
		['another secret', (rawBody: Buffer) => signedHeaders(rawBody, 'whsec_other')],
		['an expired signature', () => ({ 'crossmart-signature': 't=1000,v1=00' })],
	])('rejects %s with 401, without starting the workflow', async (_case, headersOf) => {
		const result = await deliver(envelope('order.created'), headersOf);

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.statusCode).toBe(401);
		expect(staticData.recentEventIds).toBeUndefined();
	});

	it('rejects a tampered body with 401', async () => {
		const rawBody = Buffer.from(JSON.stringify(envelope('order.created')));
		const headers = signedHeaders(rawBody);
		const tampered = Buffer.from(JSON.stringify({ ...envelope('order.created'), id: 'evt_x' }));
		const context = fakeWebhookFunctions(
			PARAMETERS,
			staticData,
			{ headers, rawBody: tampered },
			response,
		);

		const result = await trigger.webhook?.call(context);

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.statusCode).toBe(401);
	});

	it('rejects every delivery when it has no secret', async () => {
		staticData = {};

		await deliver(envelope('order.created'));

		expect(response.statusCode).toBe(401);
	});

	it('rejects a signed body that is not an event with 400', async () => {
		const result = await deliver({ hello: 'world' });

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.statusCode).toBe(400);
	});
});
