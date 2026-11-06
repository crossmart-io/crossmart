import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ApiCall } from '../api/api-call.js';
import type { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { CrossmartApiError } from '../api/crossmart-api.error.js';
import { JSON_INDENTATION, type RefusalStatus } from '../mcp.constants.js';

/**
 * One MCP tool as data: its name, what it is for, its input, and the API call it makes.
 * Every tool is a thin, typed door onto one REST endpoint.
 */
export interface ApiToolSpec<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: Shape;
  /** True for tools that only read. */
  readOnly: boolean;
  /** True for tools that delete or take things off sale. */
  destructive?: boolean;
  /** What the agent should do next when the API refuses the call with one of these statuses. */
  refusalHints?: Partial<Record<RefusalStatus, string>>;
  toCall: (input: z.infer<z.ZodObject<Shape>>) => ApiCall;
}

/** Keeps each spec's input type while collecting specs of different shapes in one list. */
export function defineTool<Shape extends z.ZodRawShape>(spec: ApiToolSpec<Shape>): ApiToolSpec {
  return spec as unknown as ApiToolSpec;
}

function toText(value: unknown): string {
  return JSON.stringify(value, null, JSON_INDENTATION);
}

/** The refusal as the agent reads it: status, the API's code and message, and a next step. */
function toRefusalText(spec: ApiToolSpec, error: CrossmartApiError): string {
  const reason = error.code ? `${error.status} ${error.code}` : String(error.status);
  const hint = spec.refusalHints?.[error.status as RefusalStatus];
  const refusal = `Crossmart refused (${reason}): ${error.message}`;
  return hint ? `${refusal}\n${hint}` : refusal;
}

async function run(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<CallToolResult> {
  try {
    const result = await client.call(spec.toCall(input as never));
    return { content: [{ type: 'text', text: toText(result) }] };
  } catch (error) {
    if (!(error instanceof CrossmartApiError)) throw error;
    return {
      isError: true,
      content: [{ type: 'text', text: toRefusalText(spec, error) }],
    };
  }
}

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
