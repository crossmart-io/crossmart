import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiCredential } from '../api/api-credential.js';
import { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { MCP_SERVER_NAME } from '../mcp.constants.js';
import { type ApiToolSpec, registerApiTool } from '../tools/api-tool.js';
import { ALL_TOOLS } from '../tools/index.js';

const SERVER_VERSION = process.env.npm_package_version ?? '0.0.0';

const INSTRUCTIONS =
  'Crossmart keeps one catalog and one stock count for a seller and publishes them to their ' +
  'stores. Read before you write: find ids with list_products, list_inventory or list_stores. ' +
  'Every change is recorded in the activity log, credited to you and the person who connected you ' +
  '(or to the API key). For questions about Crossmart itself (features, plans, how to do ' +
  'something), use ask_crossmart.';

/**
 * The tools a credential may use: every tool for an API key (its role decides in the API), and
 * for an agent only those its scopes cover, so it is never offered a tool it cannot call.
 */
export function toolsFor(credential: ApiCredential | undefined): readonly ApiToolSpec[] {
  const scopes = credential?.scopes;
  if (!scopes) return ALL_TOOLS;
  return ALL_TOOLS.filter((tool) => tool.scope === undefined || scopes.includes(tool.scope));
}

/** An MCP server whose tools act with one credential. */
export function createMcpServer(apiUrl: string, credential: ApiCredential | undefined): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );
  const client = new CrossmartApiClient(apiUrl, credential);
  for (const tool of toolsFor(credential)) registerApiTool(server, tool, client);
  return server;
}
