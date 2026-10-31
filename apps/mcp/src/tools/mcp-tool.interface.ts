import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/** One MCP tool. Each tool lives in its own class and registers itself on the server. */
export interface McpTool {
  register(server: McpServer): void;
}
