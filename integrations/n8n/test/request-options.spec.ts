import { describe, expect, it } from 'vitest';
import { ApiPath } from '../nodes/shared/api-paths';
import { HttpMethod } from '../nodes/shared/crossmart.enums';
import {
	buildRequestOptions,
	compactQuery,
	normalizeBaseUrl,
} from '../nodes/shared/request-options';

describe('normalizeBaseUrl', () => {
	it.each([
		['https://api.crossmart.io', 'https://api.crossmart.io'],
		['https://api.crossmart.io/', 'https://api.crossmart.io'],
		['https://api.crossmart.io/api/v1', 'https://api.crossmart.io'],
		['  http://localhost:3000/api/v1/  ', 'http://localhost:3000'],
		['', 'https://api.crossmart.io'],
	])('turns %j into %j', (baseUrl, expected) => {
		expect(normalizeBaseUrl(baseUrl)).toBe(expected);
	});
});

describe('compactQuery', () => {
	it('drops unset and empty values and keeps the rest', () => {
		expect(
			compactQuery({
				search: '',
				status: undefined,
				tags: [],
				limit: 10,
				vendor: 'Acme',
				returnAll: false,
			}),
		).toEqual({ limit: 10, vendor: 'Acme', returnAll: false });
	});
});

describe('buildRequestOptions', () => {
	it('builds a GET with its query and repeated array keys', () => {
		const options = buildRequestOptions('https://api.crossmart.io/', {
			method: HttpMethod.Get,
			path: ApiPath.products('ws-1'),
			query: { tags: ['mug', 'gift'], search: '', limit: 5 },
		});

		expect(options).toEqual({
			method: 'GET',
			url: 'https://api.crossmart.io/api/v1/workspaces/ws-1/products',
			json: true,
			arrayFormat: 'repeat',
			qs: { tags: ['mug', 'gift'], limit: 5 },
		});
	});

	it('sends a body only when there is one', () => {
		const withBody = buildRequestOptions('https://api.crossmart.io', {
			method: HttpMethod.Post,
			path: '/api/v1/x',
			body: { quantity: 1 },
		});
		const withoutBody = buildRequestOptions('https://api.crossmart.io', {
			method: HttpMethod.Post,
			path: '/api/v1/x',
		});

		expect(withBody.body).toEqual({ quantity: 1 });
		expect(withoutBody).not.toHaveProperty('body');
		expect(withoutBody).not.toHaveProperty('qs');
	});

	it('encodes ids in paths', () => {
		expect(ApiPath.product('ws 1', 'a/b')).toBe('/api/v1/workspaces/ws%201/products/a%2Fb');
	});
});
