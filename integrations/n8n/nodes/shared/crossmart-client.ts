import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
} from 'n8n-workflow';
import { ApiPath } from './api-paths';
import { CREDENTIAL_TYPE, DEFAULT_BASE_URL, MAX_PAGE_SIZE } from './crossmart.constants';
import { HttpMethod } from './crossmart.enums';
import type { CurrentApiKey, Page } from './crossmart.types';
import { toNodeApiError } from './errors';
import { type ApiRequest, buildRequestOptions, type QueryParams } from './request-options';

/** The n8n contexts that call the API: actions, polling triggers and dropdown loaders. */
export type RequestContext = IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions;

/** Builds a workspace-scoped route from the workspace id. */
export type WorkspacePath = (workspaceId: string) => string;

/**
 * A thin client of the Crossmart REST API on top of n8n's authenticated HTTP helper, so the
 * package has no runtime dependencies. An API key belongs to one workspace: the client finds it
 * once per execution with `GET /api/v1/api-key`.
 */
export class CrossmartClient {
	private workspaceIdRequest: Promise<string> | undefined;

	private constructor(
		private readonly context: RequestContext,
		private readonly baseUrl: string,
	) {}

	static async fromContext(context: RequestContext): Promise<CrossmartClient> {
		const credentials = await context.getCredentials(CREDENTIAL_TYPE);
		const baseUrl = typeof credentials.baseUrl === 'string' ? credentials.baseUrl : '';
		return new CrossmartClient(context, baseUrl || DEFAULT_BASE_URL);
	}

	async request<Response>(request: ApiRequest): Promise<Response> {
		const options = buildRequestOptions(this.baseUrl, request);
		try {
			const response: Response = await this.context.helpers.httpRequestWithAuthentication.call(
				this.context,
				CREDENTIAL_TYPE,
				options,
			);
			return response;
		} catch (error) {
			throw toNodeApiError(this.context.getNode(), error);
		}
	}

	/** GET on a route of the API key's workspace. */
	async get<Response>(path: WorkspacePath, query?: QueryParams): Promise<Response> {
		return this.request<Response>({
			method: HttpMethod.Get,
			path: path(await this.workspaceId()),
			query,
		});
	}

	/** A write on a route of the API key's workspace. */
	async send<Response>(
		method: HttpMethod,
		path: WorkspacePath,
		body?: IDataObject,
	): Promise<Response> {
		return this.request<Response>({ method, path: path(await this.workspaceId()), body });
	}

	/** The workspace the API key works in. */
	async workspaceId(): Promise<string> {
		this.workspaceIdRequest ??= this.request<CurrentApiKey>({
			method: HttpMethod.Get,
			path: ApiPath.currentApiKey(),
		}).then((apiKey) => apiKey.workspaceId);
		return this.workspaceIdRequest;
	}

	/** One page of a list endpoint. */
	async getPage<Item>(path: WorkspacePath, query: QueryParams = {}): Promise<Page<Item>> {
		return this.get<Page<Item>>(path, query);
	}

	/**
	 * Items of a list endpoint, following `nextCursor`. Stops at `maxItems` when given, and asks
	 * only for the page size it still needs.
	 */
	async getAll<Item>(
		path: WorkspacePath,
		query: QueryParams = {},
		maxItems?: number,
	): Promise<Item[]> {
		const items: Item[] = [];
		let cursor: string | undefined;
		do {
			const limit =
				maxItems === undefined ? MAX_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, maxItems - items.length);
			const page = await this.getPage<Item>(path, { ...query, limit, cursor });
			items.push(...page.items);
			cursor = page.nextCursor ?? undefined;
		} while (cursor !== undefined && (maxItems === undefined || items.length < maxItems));
		return maxItems === undefined ? items : items.slice(0, maxItems);
	}
}
