import type { ApiToolResult } from '@crossmart/core/agent-tools/tools/api-tool.js';
import { ToolCallOutcome } from './mcp-log.constants.js';
import type { ToolCallRecord } from './mcp-request-log.js';

/** How many items a list answered with: an array's length, or a page's `items`. */
export function itemCount(value: unknown): number | undefined {
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object' || value === null || !('items' in value)) return undefined;
  return Array.isArray(value.items) ? value.items.length : undefined;
}

function outcomeOf(result: ApiToolResult): ToolCallOutcome {
  if (result.isError) return ToolCallOutcome.Refused;
  return result.proposed ? ToolCallOutcome.Proposed : ToolCallOutcome.Ok;
}

/** What the log keeps of a finished call: its outcome and counts, never its content. */
export function toToolCallRecord(
  tool: string,
  result: ApiToolResult,
  durationMs: number,
): ToolCallRecord {
  return {
    tool,
    outcome: outcomeOf(result),
    durationMs,
    status: result.status,
    code: result.code,
    items: result.isError ? undefined : itemCount(result.value),
  };
}
