import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INode,
	INodeExecutionData,
	IPollFunctions,
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
