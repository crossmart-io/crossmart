import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CrossmartApiClient } from './api/crossmart-api-client.js';
import {
  CROSSMART_API_URL_ENV,
  DEFAULT_CROSSMART_API_URL,
  MCP_SERVER_NAME,
} from './mcp.constants.js';
import type { McpTool } from './tools/mcp-tool.interface.js';
import { GetPlatformHealthTool } from './tools/get-platform-health.tool.js';

const SERVER_VERSION = process.env.npm_package_version ?? '0.0.0';

function createTools(apiClient: CrossmartApiClient): McpTool[] {
  return [new GetPlatformHealthTool(apiClient)];
}

async function bootstrap(): Promise<void> {
  const apiUrl = process.env[CROSSMART_API_URL_ENV] ?? DEFAULT_CROSSMART_API_URL;
  const apiClient = new CrossmartApiClient(apiUrl);
  const server = new McpServer({ name: MCP_SERVER_NAME, version: SERVER_VERSION });

  for (const tool of createTools(apiClient)) {
    tool.register(server);
  }

  await server.connect(new StdioServerTransport());
}

await bootstrap();
