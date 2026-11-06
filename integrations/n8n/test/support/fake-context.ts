import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	INode,
	INodeExecutionData,
	IPollFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { BASE_URL, type FakeApi } from './fake-api';

const NODE: INode = {
	id: 'node-1',
	name: 'Crossmart',
	type: 'n8n-nodes-crossmart.crossmart',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

type Parameters = Record<string, unknown>;

/** The members of n8n's function contexts the Crossmart nodes use. */
function sharedMembers(api: FakeApi) {
	return {
		getNode: () => NODE,
		getCredentials: async () => ({ apiKey: 'test-key', baseUrl: `${BASE_URL}/` }),
		helpers: {
			httpRequestWithAuthentication: async (
				_credentialType: string,
				request: IHttpRequestOptions,
			) => api.handle(request),
			returnJsonArray: (items: IDataObject[]): INodeExecutionData[] =>
				items.map((json) => ({ json })),
		},
	};
}

/**
 * A stand-in for n8n's execute context. The real interface is large; tests implement the members
 * the node calls, so the double is cast once here.
 */
export function fakeExecuteFunctions(
	api: FakeApi,
	parametersPerItem: Parameters[],
	options: { continueOnFail?: boolean } = {},
): IExecuteFunctions {
	const context = {
		...sharedMembers(api),
		getInputData: () => parametersPerItem.map(() => ({ json: {} })),
		getNodeParameter: (name: string, itemIndex: number, fallback?: unknown) =>
			parametersPerItem[itemIndex][name] ?? fallback,
		continueOnFail: () => options.continueOnFail ?? false,
	};
	return context as unknown as IExecuteFunctions;
}

/** A stand-in for n8n's polling context, with the node's static data. */
export function fakePollFunctions(
	api: FakeApi,
	parameters: Parameters,
	staticData: IDataObject,
	mode: 'trigger' | 'manual' = 'trigger',
): IPollFunctions {
	const context = {
		...sharedMembers(api),
		getMode: () => mode,
		getNodeParameter: (name: string, fallback?: unknown) => parameters[name] ?? fallback,
		getWorkflowStaticData: () => staticData,
	};
	return context as unknown as IPollFunctions;
}

export const WEBHOOK_URL = 'https://n8n.example.test/webhook/hook-1/webhook';

export const WORKFLOW = { id: 'wf-1', name: 'Orders to Sheets', active: true };

/** A stand-in for n8n's webhook lifecycle context, with the node's static data. */
export function fakeHookFunctions(
	api: FakeApi,
	parameters: Parameters,
	staticData: IDataObject,
	webhookUrl: string = WEBHOOK_URL,
): IHookFunctions {
	const context = {
		...sharedMembers(api),
		getNodeParameter: (name: string, fallback?: unknown) => parameters[name] ?? fallback,
		getWorkflowStaticData: () => staticData,
		getNodeWebhookUrl: () => webhookUrl,
		getWorkflow: () => WORKFLOW,
	};
	return context as unknown as IHookFunctions;
}

/** What a webhook call sent: its headers and its body, byte for byte. */
export type FakeDelivery = {
	headers: Record<string, string>;
	rawBody: Buffer;
};

/** Records the status and body the trigger answers with when it rejects a delivery. */
export class FakeResponse {
	statusCode: number | undefined;
	body: IDataObject | undefined;

	status(code: number): this {
		this.statusCode = code;
		return this;
	}

	json(body: IDataObject): this {
		this.body = body;
		return this;
	}
}

/** A stand-in for n8n's webhook context: one delivery to the trigger's URL. */
export function fakeWebhookFunctions(
	parameters: Parameters,
	staticData: IDataObject,
	delivery: FakeDelivery,
	response: FakeResponse,
): IWebhookFunctions {
	const context = {
		getNode: () => NODE,
		getNodeParameter: (name: string, fallback?: unknown) => parameters[name] ?? fallback,
		getWorkflowStaticData: () => staticData,
		getHeaderData: () => delivery.headers,
		getRequestObject: () => ({ rawBody: delivery.rawBody }),
		getResponseObject: () => response,
	};
	return context as unknown as IWebhookFunctions;
}
