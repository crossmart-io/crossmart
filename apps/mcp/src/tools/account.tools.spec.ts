import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpMethod } from '@crossmart/core/agent-tools/api/api-call.js';
import { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import { SANDBOX_ACCOUNTS_PATH } from '@crossmart/core/agent-tools/agent-tools.constants.js';
import { ANONYMOUS_TOOLS } from '@crossmart/core/agent-tools/tools/account.tools.js';
import { registerApiTool } from './register-api-tool.js';

const API_URL = 'https://api.example.com';
const INPUT = { email: 'ana@example.com', storeName: 'Ana Ceramics' };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
}

async function connect(apiClient: CrossmartApiClient): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  for (const spec of ANONYMOUS_TOOLS) registerApiTool(server, spec, apiClient);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('create_account', () => {
  it('opens the account without a key, then calls with the key it got', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ outcome: 'created', apiKey: 'cm_new', workspaceId: 'ws-1' }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const apiClient = new CrossmartApiClient(API_URL, undefined);

    const result = await (
      await connect(apiClient)
    ).callTool({
      name: 'create_account',
      arguments: INPUT,
    });
    await apiClient.call({
      method: HttpMethod.Get,
      path: '/api/v1/workspaces/ws-1/products',
    });

    expect(result.isError).toBeFalsy();
    const [opened, next] = fetchMock.mock.calls;
    expect(String(opened?.[0])).toBe(`${API_URL}${SANDBOX_ACCOUNTS_PATH}`);
    expect(opened?.[1]?.headers).not.toHaveProperty('x-api-key');
    expect(next?.[1]?.headers).toMatchObject({ 'x-api-key': 'cm_new' });
  });

  it('keeps calling without a key when nothing was opened', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ outcome: 'sign_in_required', apiKey: null }))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    const apiClient = new CrossmartApiClient(API_URL, undefined);

    await (await connect(apiClient)).callTool({ name: 'create_account', arguments: INPUT });
    await apiClient.call({ method: HttpMethod.Get, path: '/api/v1/ask' });

    expect(fetchMock.mock.calls[1]?.[1]?.headers).not.toHaveProperty('x-api-key');
  });
});
