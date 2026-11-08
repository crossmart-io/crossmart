import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import { type ApiToolSpec, runApiTool } from '@crossmart/core/agent-tools/tools/api-tool.js';

async function run(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<CallToolResult> {
  const result = await runApiTool(spec, client, input);
  return {
    ...(result.isError ? { isError: true } : {}),
    content: [{ type: 'text', text: result.text }],
  };
}

/** Offers one shared agent tool (`libs/core/src/agent-tools`) on the MCP server. */
export function registerApiTool(
  server: McpServer,
  spec: ApiToolSpec,
  client: CrossmartApiClient,
): void {
  server.registerTool(
    spec.name,
    {
      title: spec.title,
      description: spec.description,
      inputSchema: spec.input,
      annotations: {
        readOnlyHint: spec.readOnly,
        destructiveHint: spec.destructive ?? false,
        openWorldHint: false,
      },
    },
    (input: Record<string, unknown>) => run(spec, client, input),
  );
}
