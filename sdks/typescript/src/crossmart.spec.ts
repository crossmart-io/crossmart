import { describe, expect, it } from 'vitest';
import { Crossmart } from './crossmart.js';
import { CrossmartError } from './errors.js';
import {
  jsonResponse,
  mockFetch,
  OTHER_WORKSPACE_ID,
  TEST_BASE_URL,
  WORKSPACE_ID,
} from './testing/mock-fetch.js';

const EMPTY_PAGE = { items: [], nextCursor: null, total: 0 };
const PRODUCTS_URL = `${TEST_BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/products`;

describe('Crossmart', () => {
  describe('authentication', () => {
    it('sends an API key in the x-api-key header', async () => {
      const { fetch, requests } = mockFetch(() => jsonResponse(EMPTY_PAGE));
      const crossmart = new Crossmart(
        { apiKey: 'cm_live_key' },
        { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
      );

      await crossmart.products.list();

      expect(requests[0]?.headers.get('x-api-key')).toBe('cm_live_key');
      expect(requests[0]?.headers.get('authorization')).toBeNull();
    });

    it('sends an access token as a bearer token', async () => {
      const { fetch, requests } = mockFetch(() => jsonResponse(EMPTY_PAGE));
      const crossmart = new Crossmart(
        { accessToken: 'agent-token' },
        { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
      );

      await crossmart.products.list();

      expect(requests[0]?.headers.get('authorization')).toBe('Bearer agent-token');
      expect(requests[0]?.headers.get('x-api-key')).toBeNull();
    });

    it('refuses to start without credentials', () => {
      expect(() => new Crossmart({ apiKey: '' })).toThrow(CrossmartError);
    });
  });

  describe('base URL', () => {
    it('calls the hosted API by default', async () => {
      const { fetch, requests } = mockFetch(() => jsonResponse(EMPTY_PAGE));
      const crossmart = new Crossmart({ apiKey: 'key' }, { workspaceId: WORKSPACE_ID, fetch });

      await crossmart.products.list();

      expect(requests[0]?.url).toBe(
        `https://api.crossmart.io/api/v1/workspaces/${WORKSPACE_ID}/products`,
      );
    });

    it('serialises query parameters, repeating arrays', async () => {
      const { fetch, requests } = mockFetch(() => jsonResponse(EMPTY_PAGE));
      const crossmart = new Crossmart(
        { apiKey: 'key' },
        { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
      );

      await crossmart.products.list({ search: 'mug', tags: ['sale', 'new'], limit: 5 });

      expect(requests[0]?.url).toBe(`${PRODUCTS_URL}?search=mug&tags=sale&tags=new&limit=5`);
    });
  });

  describe('workspace', () => {
    it('prefers the workspace passed to the method over the default', async () => {
      const { fetch, requests } = mockFetch(() => jsonResponse(EMPTY_PAGE));
      const crossmart = new Crossmart(
        { apiKey: 'key' },
        { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
      );

      await crossmart.products.list({}, { workspaceId: OTHER_WORKSPACE_ID });

      expect(requests[0]?.url).toContain(`/workspaces/${OTHER_WORKSPACE_ID}/products`);
    });

    it("looks up an API key's workspace once and reuses it", async () => {
      const { fetch, requests } = mockFetch(
        () => jsonResponse({ apiKeyId: 'key-id', workspaceId: WORKSPACE_ID, role: 'EDITOR' }),
        () => jsonResponse(EMPTY_PAGE),
        () => jsonResponse([]),
      );
      const crossmart = new Crossmart({ apiKey: 'key' }, { baseUrl: TEST_BASE_URL, fetch });

      await crossmart.products.list();
      await crossmart.stores.list();

      expect(requests.map((request) => request.url)).toEqual([
        `${TEST_BASE_URL}/api/v1/api-key`,
        PRODUCTS_URL,
        `${TEST_BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/channel-connections`,
      ]);
    });

    it('asks for a workspace when an access token has none', async () => {
      const { fetch } = mockFetch();
      const crossmart = new Crossmart({ accessToken: 'token' }, { baseUrl: TEST_BASE_URL, fetch });

      await expect(crossmart.products.list()).rejects.toThrow(/No workspace id/);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
