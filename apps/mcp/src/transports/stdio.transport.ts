import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { apiKeyCredential } from '../api/api-credential.js';
import type { McpConfig } from '../config/mcp-config.js';
import { createMcpServer } from '../server/create-mcp-server.js';

/** The local server an MCP client starts, with the key from `CROSSMART_API_KEY`. */
export async function serveStdio(config: McpConfig): Promise<void> {
  const credential = config.apiKey ? apiKeyCredential(config.apiKey) : undefined;
  await createMcpServer(config.apiUrl, credential).connect(new StdioServerTransport());
}
