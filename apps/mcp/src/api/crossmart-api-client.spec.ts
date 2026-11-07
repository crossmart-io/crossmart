import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import { HttpMethod } from './api-call.js';
import { accessTokenCredential, type ApiCredential, apiKeyCredential } from './api-credential.js';
import { CrossmartApiClient } from './crossmart-api-client.js';
import { CrossmartApiError } from './crossmart-api.error.js';

const API_URL = 'https://api.example.com';
const WORKSPACE_ID = 'ws-1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setupWith(credential: ApiCredential, ...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, client: new CrossmartApiClient(API_URL, credential) };
}

function setup(...responses: Response[]) {
  return setupWith(apiKeyCredential('cm_key'), ...responses);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CrossmartApiClient', () => {
  it('finds the key’s workspace once and fills it into paths', async () => {
    const { fetchMock, client } = setup(
      jsonResponse({ workspaceId: WORKSPACE_ID }),
      jsonResponse({ items: [] }),
      jsonResponse({ items: [] }),
    );
    const call = {
      method: HttpMethod.Get,
      path: '/api/v1/workspaces/{workspaceId}/products',
      query: { search: 'mug', page: 2, status: undefined },
    };
    await client.call(call);
    await client.call(call);

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      `${API_URL}/api/v1/api-key`,
      `${API_URL}/api/v1/workspaces/${WORKSPACE_ID}/products?search=mug&page=2`,
      `${API_URL}/api/v1/workspaces/${WORKSPACE_ID}/products?search=mug&page=2`,
    ]);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({ 'x-api-key': 'cm_key' });
  });

  it('uses the workspace an agent token names, and sends the token as a bearer', async () => {
    const credential = accessTokenCredential('a.b.c', WORKSPACE_ID, [AgentScope.CatalogRead]);
    const { fetchMock, client } = setupWith(credential, jsonResponse({ items: [] }));

    await client.call({
      method: HttpMethod.Get,
      path: '/api/v1/workspaces/{workspaceId}/products',
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `${API_URL}/api/v1/workspaces/${WORKSPACE_ID}/products`,
    );
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer a.b.c' });
  });

  it('sends bodies as JSON and reads an empty answer as done', async () => {
    const { fetchMock, client } = setup(new Response(null, { status: 204 }));
    const result = await client.call({
      method: HttpMethod.Post,
      path: '/api/v1/x',
      body: { quantity: 1 },
    });
    expect(result).toEqual({ done: true });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: '{"quantity":1}' });
  });

  it('turns a refusal into an error with the API’s message', async () => {
    const { client } = setup(
      jsonResponse({ message: ['price must be an amount', 'title is empty'] }, 400),
    );
    await expect(client.call({ method: HttpMethod.Get, path: '/api/v1/x' })).rejects.toEqual(
      new CrossmartApiError(400, 'price must be an amount; title is empty'),
    );
  });

  it('keeps the API’s error code when it gives one', async () => {
    const { client } = setup(
      jsonResponse({ message: 'Upgrade to add listings', code: 'plan_limit_reached' }, 402),
    );
    await expect(client.call({ method: HttpMethod.Get, path: '/api/v1/x' })).rejects.toMatchObject({
      status: 402,
      code: 'plan_limit_reached',
    });
  });

  it('adopts a credential only when it has none', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal('fetch', fetchMock);
    const anonymous = new CrossmartApiClient(API_URL, undefined);
    const keyed = new CrossmartApiClient(API_URL, apiKeyCredential('cm_old'));

    anonymous.adoptCredential(apiKeyCredential('cm_new'));
    keyed.adoptCredential(apiKeyCredential('cm_new'));
    await anonymous.call({ method: HttpMethod.Get, path: '/api/v1/x' });
    await keyed.call({ method: HttpMethod.Get, path: '/api/v1/x' });

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ 'x-api-key': 'cm_new' });
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({ 'x-api-key': 'cm_old' });
  });
});
