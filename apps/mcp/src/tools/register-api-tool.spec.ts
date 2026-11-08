import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiKeyCredential } from '@crossmart/core/agent-tools/api/api-credential.js';
import { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import { CrossmartApiError } from '@crossmart/core/agent-tools/api/crossmart-api.error.js';
import {
  AgentToolName,
  RefusalStatus,
  WEBHOOK_SECRET_WITHHELD,
} from '@crossmart/core/agent-tools/agent-tools.constants.js';
import { registerApiTool } from './register-api-tool.js';
import { ALL_TOOLS } from '@crossmart/core/agent-tools/tools/index.js';

const RETRY_TOOL = 'retry_store_listing';
const RETRY_INPUT = {
  productId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  connectionId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
};

async function connect(apiClient: CrossmartApiClient): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  for (const spec of ALL_TOOLS) registerApiTool(server, spec, apiClient);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

function refusingClient(error: CrossmartApiError): CrossmartApiClient {
  const apiClient = new CrossmartApiClient('https://api.example.com', apiKeyCredential('cm_key'));
  vi.spyOn(apiClient, 'call').mockRejectedValue(error);
  return apiClient;
}

function answeringClient(value: unknown): CrossmartApiClient {
  const apiClient = new CrossmartApiClient('https://api.example.com', apiKeyCredential('cm_key'));
  vi.spyOn(apiClient, 'call').mockResolvedValue(value);
  return apiClient;
}

function firstText(result: Awaited<ReturnType<Client['callTool']>>): string {
  const [content] = result.content as { type: string; text: string }[];
  return content?.text ?? '';
}

describe('API tools', () => {
  it('turns a refusal into an error with the API’s code and the tool’s next step', async () => {
    const error = new CrossmartApiError(RefusalStatus.Conflict, 'Store is not connected', 'x');
    const client = await connect(refusingClient(error));
    const result = await client.callTool({ name: RETRY_TOOL, arguments: RETRY_INPUT });

    expect(result.isError).toBe(true);
    const text = firstText(result);
    expect(text).toContain('Crossmart refused (409 x): Store is not connected');
    expect(text).toContain('add_product_to_store');
  });

  it('gives only the API’s message when the tool has no hint for the status', async () => {
    const error = new CrossmartApiError(RefusalStatus.NotFound, 'Product not found');
    const client = await connect(refusingClient(error));
    const result = await client.callTool({ name: RETRY_TOOL, arguments: RETRY_INPUT });

    expect(firstText(result)).toBe('Crossmart refused (404): Product not found');
  });

  it('lists every tool with its read-only hint', async () => {
    const apiClient = new CrossmartApiClient('https://api.example.com', apiKeyCredential('cm_key'));
    const { tools } = await (await connect(apiClient)).listTools();

    expect(tools.map((listed) => listed.name)).toEqual(ALL_TOOLS.map((spec) => spec.name));
    const itemSpecifics = tools.find((listed) => listed.name === 'get_item_specifics');
    expect(itemSpecifics?.annotations?.readOnlyHint).toBe(true);
  });

  it('tells clients overwrites are destructive and publishing is open-world', async () => {
    const { tools } = await (await connect(answeringClient({}))).listTools();
    const annotationsOf = (name: string) =>
      tools.find((listed) => listed.name === name)?.annotations;

    expect(annotationsOf(AgentToolName.UpdateProductText)).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    });
    expect(annotationsOf(AgentToolName.AskCrossmart)).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
  });

  it('answers a new webhook endpoint without its signing secret', async () => {
    const endpoint = { id: 'we-1', url: 'https://example.com/hooks' };
    const client = await connect(answeringClient({ endpoint, secret: 'whsec_live_secret' }));
    const result = await client.callTool({
      name: AgentToolName.CreateWebhookEndpoint,
      arguments: { url: endpoint.url, eventTypes: ['order.created'] },
    });

    const text = firstText(result);
    expect(text).not.toContain('whsec_live_secret');
    expect(JSON.parse(text)).toEqual({ endpoint, signingSecret: WEBHOOK_SECRET_WITHHELD });
  });
});
