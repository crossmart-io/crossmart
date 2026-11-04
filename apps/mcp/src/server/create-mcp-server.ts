import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { MCP_SERVER_NAME } from '../mcp.constants.js';
import { registerApiTool } from '../tools/api-tool.js';
import { ALL_TOOLS } from '../tools/index.js';

const SERVER_VERSION = process.env.npm_package_version ?? '0.0.0';

const INSTRUCTIONS =
  'Crossmart keeps one catalog and one stock count for a seller and publishes them to their ' +
  'stores. Read before you write: find ids with list_products, list_inventory or list_stores. ' +
  'Every change is recorded in the activity log under this API key.';

/** An MCP server whose tools act with one API key. */
export function createMcpServer(apiUrl: string, apiKey: string | undefined): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );
  const client = new CrossmartApiClient(apiUrl, apiKey);
  for (const tool of ALL_TOOLS) registerApiTool(server, tool, client);
  return server;
}
