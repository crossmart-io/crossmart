import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { CrossmartApiClient } from '@crossmart/core/agent-tools/api/crossmart-api-client.js';
import {
  type ApiToolResult,
  type ApiToolSpec,
  requiresApproval,
  runApiTool,
  toText,
} from '@crossmart/core/agent-tools/tools/api-tool.js';
import { proposeApiTool } from '@crossmart/core/agent-tools/tools/propose-api-tool.js';
import { ToolCallOutcome } from '../observability/mcp-log.constants.js';
import type { ToolCallObserver } from '../observability/mcp-request-log.js';
import { toToolCallRecord } from '../observability/tool-call-record.js';
import { toolAnnotations } from './tool-annotations.js';

function call(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<ApiToolResult> {
  return requiresApproval(spec)
    ? proposeApiTool(spec, client, input)
    : runApiTool(spec, client, input);
}

/** Makes the call, and tells the observer how it went and how long it took. */
async function observedCall(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
  observer: ToolCallObserver | undefined,
): Promise<ApiToolResult> {
  const startedAt = performance.now();
  const elapsed = (): number => Math.round(performance.now() - startedAt);
  const workspaceId = (): string | undefined => client.knownWorkspaceId;
  try {
    const result = await call(spec, client, input);
    observer?.toolCalled({
      ...toToolCallRecord(spec.name, result, elapsed()),
      workspaceId: workspaceId(),
    });
    return result;
  } catch (error) {
    const outcome = ToolCallOutcome.Failed;
    observer?.toolCalled({
      tool: spec.name,
      outcome,
      durationMs: elapsed(),
      workspaceId: workspaceId(),
    });
    throw error;
  }
}

async function run(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
  observer: ToolCallObserver | undefined,
): Promise<CallToolResult> {
  const result = await observedCall(spec, client, input, observer);
  return {
    ...(result.isError ? { isError: true } : {}),
    content: toContent(result),
  };
}

/**
 * The answer as the API gave it, then, when it shows an empty account, a second block with the
 * next step (`{"next": ...}`). The first block never changes shape, so clients that parse it
 * keep working.
 */
function toContent(result: ApiToolResult): CallToolResult['content'] {
  const answer = { type: 'text' as const, text: result.text };
  if (!result.next) return [answer];
  return [answer, { type: 'text' as const, text: toText({ next: result.next }) }];
}

/**
 * Offers one shared agent tool (`libs/core/src/agent-tools`) on the MCP server. A write in the
 * workspace is proposed first (ADR 0028): it waits for the seller's approval when the workspace
 * asks for it, whatever credential the session carries, and runs at once otherwise. The
 * observer, when given, hears how each call went (the remote server's request log).
 */
export function registerApiTool(
  server: McpServer,
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  observer?: ToolCallObserver,
): void {
  server.registerTool(
    spec.name,
    {
      title: spec.title,
      description: spec.description,
      inputSchema: spec.input,
      annotations: toolAnnotations(spec),
    },
    (input: Record<string, unknown>) => run(spec, client, input, observer),
  );
}
