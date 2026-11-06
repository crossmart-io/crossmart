import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import { API_VERSION_PREFIX, DEFAULT_BASE_URL, TRAILING_SLASHES } from './crossmart.constants';
import type { HttpMethod } from './crossmart.enums';

export type QueryValue = string | number | boolean | string[] | undefined;

export type QueryParams = Record<string, QueryValue>;

/** One call to the Crossmart API, before the base URL and the API key are added. */
export type ApiRequest = {
	method: HttpMethod;
	/** The route, starting with `/api/v1`. */
	path: string;
	query?: QueryParams;
	body?: IDataObject;
};

/**
 * The base URL without trailing slashes or `/api/v1`, so `https://api.crossmart.io/`,
 * `https://api.crossmart.io` and `https://api.crossmart.io/api/v1` all work.
 */
export function normalizeBaseUrl(baseUrl: string): string {
	const trimmed = baseUrl.trim().replace(TRAILING_SLASHES, '');
	const withoutPrefix = trimmed.endsWith(API_VERSION_PREFIX)
		? trimmed.slice(0, -API_VERSION_PREFIX.length)
		: trimmed;
	return withoutPrefix || DEFAULT_BASE_URL;
}

const isPresent = (value: QueryValue): boolean =>
	value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);

/** The query without empty values, so unset filters are not sent. */
export function compactQuery(query: QueryParams = {}): IDataObject {
	const compacted: IDataObject = {};
	for (const [key, value] of Object.entries(query)) {
		if (isPresent(value)) compacted[key] = value;
	}
	return compacted;
}

/** The options n8n's HTTP helper sends. Repeated query keys carry arrays (`tags=a&tags=b`). */
export function buildRequestOptions(baseUrl: string, request: ApiRequest): IHttpRequestOptions {
	const options: IHttpRequestOptions = {
		method: request.method,
		url: `${normalizeBaseUrl(baseUrl)}${request.path}`,
		json: true,
		arrayFormat: 'repeat',
	};
	const qs = compactQuery(request.query);
	if (Object.keys(qs).length > 0) options.qs = qs;
	if (request.body !== undefined) options.body = request.body;
	return options;
}
