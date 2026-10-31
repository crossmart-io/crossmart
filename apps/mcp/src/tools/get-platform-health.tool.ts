import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { CrossmartApiClient } from '../api/crossmart-api-client.js';
import type { McpTool } from './mcp-tool.interface.js';

const TOOL_NAME = 'get_platform_health';
const JSON_INDENTATION = 2;

export class GetPlatformHealthTool implements McpTool {
  constructor(private readonly apiClient: CrossmartApiClient) {}

  register(server: McpServer): void {
    server.registerTool(
      TOOL_NAME,
      {
        title: 'Get platform health',
        description: 'Check that the Crossmart API and its database are reachable.',
        annotations: { readOnlyHint: true },
      },
      () => this.execute(),
    );
  }

  private async execute(): Promise<CallToolResult> {
    const health = await this.apiClient.getHealth();
    return {
      content: [{ type: 'text', text: JSON.stringify(health, null, JSON_INDENTATION) }],
    };
  }
}
