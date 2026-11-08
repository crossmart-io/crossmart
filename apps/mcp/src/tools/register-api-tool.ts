import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import {
  type ApiToolSpec,
  requiresApproval,
  runApiTool,
} from '@crossmart/core/agent-tools/tools/api-tool.js';
import { proposeApiTool } from '@crossmart/core/agent-tools/tools/propose-api-tool.js';
import { toolAnnotations } from './tool-annotations.js';

async function run(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<CallToolResult> {
  const result = requiresApproval(spec)
    ? await proposeApiTool(spec, client, input)
    : await runApiTool(spec, client, input);
  return {
    ...(result.isError ? { isError: true } : {}),
    content: [{ type: 'text', text: result.text }],
  };
}

/**
 * Offers one shared agent tool (`libs/core/src/agent-tools`) on the MCP server. A write in the
 * workspace is proposed first (ADR 0028): it waits for the seller's approval when the workspace
 * asks for it, whatever credential the session carries, and runs at once otherwise.
 */
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
      annotations: toolAnnotations(spec),
    },
    (input: Record<string, unknown>) => run(spec, client, input),
  );
}
