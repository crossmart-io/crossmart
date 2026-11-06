import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';

export const WORKSPACE_ID = 'ws-1';
export const BASE_URL = 'https://api.example.test';
export const WORKSPACE_URL = `${BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}`;

type Route = { method: string; url: string; respond: (request: IHttpRequestOptions) => unknown };

/** An in-memory Crossmart API: answers registered routes and records every request. */
export class FakeApi {
	readonly requests: IHttpRequestOptions[] = [];
	private readonly routes: Route[] = [
		{
			method: 'GET',
			url: `${BASE_URL}/api/v1/api-key`,
			respond: () => ({ workspaceId: WORKSPACE_ID, role: 'EDITOR' }),
		},
	];

	on(method: string, url: string, respond: (request: IHttpRequestOptions) => unknown): this {
		this.routes.unshift({ method, url, respond });
		return this;
	}

	/** Fails a route with an HTTP status, as n8n's HTTP helper does. */
	onError(method: string, url: string, httpCode: string): this {
		return this.on(method, url, () => {
			throw { httpCode, message: `Request failed with status code ${httpCode}` };
		});
	}

	/** Answers a list route with these pages in turn, linked by cursors. */
	onPages(url: string, pages: IDataObject[][]): this {
		return this.on('GET', url, (request) => {
			const cursor = typeof request.qs?.cursor === 'string' ? Number(request.qs.cursor) : 0;
			const hasNext = cursor + 1 < pages.length;
			return {
				items: pages[cursor] ?? [],
				nextCursor: hasNext ? String(cursor + 1) : null,
				total: pages.flat().length,
			};
		});
	}

	async handle(request: IHttpRequestOptions): Promise<unknown> {
		this.requests.push(request);
		const route = this.routes.find(
			(candidate) => candidate.method === request.method && candidate.url === request.url,
		);
		if (route === undefined) throw new Error(`No route for ${request.method} ${request.url}`);
		return route.respond(request);
	}

	/** The requests after the workspace lookup. */
	get apiRequests(): IHttpRequestOptions[] {
		return this.requests.filter((request) => !request.url.endsWith('/api/v1/api-key'));
	}
}
