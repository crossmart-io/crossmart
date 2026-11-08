import type { z } from 'zod';
import type { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import type { ApiCall } from '../api/api-call.js';
import type { CrossmartApiClient } from '../api/crossmart-api-client.js';
import { CrossmartApiError } from '../api/crossmart-api.error.js';
import { JSON_INDENTATION, type RefusalStatus } from '../agent-tools.constants.js';

/**
 * One agent tool as data: its name, what it is for, its input, and the API call it makes. Every
 * tool is a thin, typed door onto one REST endpoint. The MCP server and Agent Worker offer the
 * same specs, so an agent meets the same validation, permissions and audit log either way.
 */
export interface ApiToolSpec<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: Shape;
  /** True for tools that only read. */
  readOnly: boolean;
  /**
   * True for tools that delete or take things off sale. Agent Worker labels these calls
   * "destructive" on its approval cards; MCP clients see them as destructive too.
   */
  destructive?: boolean;
  /**
   * True for tools that overwrite a live value (a title, a price, a stock count, a listing).
   * Only MCP clients are told such a tool is destructive (`destructiveHint`), so they confirm
   * before running it; Agent Worker's risk labels read `destructive` alone.
   */
  overwrites?: boolean;
  /**
   * True for tools that reach beyond the workspace: publish to a marketplace, send data to a
   * URL, or email someone. MCP clients see it as `openWorldHint`.
   */
  openWorld?: boolean;
  /** True for tools that publish a listing to a store (counted for bulk confirmation). */
  publishes?: boolean;
  /** Input fields that change what a buyer pays; a call that sets one changes prices. */
  priceInputs?: readonly string[];
  /**
   * True for a write that changes nothing in the catalog by itself, so it never waits for the
   * seller's approval (ADR 0028), such as asking for AI content that arrives as suggestions.
   */
  approvalExempt?: boolean;
  /** The scope an agent needs to see the tool; absent for tools every connection may use. */
  scope?: AgentScope;
  /** What the agent should do next when the API refuses the call with one of these statuses. */
  refusalHints?: Partial<Record<RefusalStatus, string>>;
  toCall: (input: z.infer<z.ZodObject<Shape>>) => ApiCall;
  /** Runs after the API answered, such as to start using a credential the answer carries. */
  afterCall?: (result: unknown, client: CrossmartApiClient) => void;
  /** What the agent reads of the API's answer, such as the answer without a secret it holds. */
  toResult?: (result: unknown) => unknown;
}

/** What a tool call gave the agent: the API's answer as text, or its refusal. */
export interface ApiToolResult {
  isError: boolean;
  text: string;
  /** The parsed answer, when the API answered. */
  value?: unknown;
  /** The HTTP status of a refusal. */
  status?: number;
}

/**
 * Whether an outside agent's call to the tool waits for the seller's approval when the workspace
 * asks for it (ADR 0028): a write in the workspace (it has a scope) that is not exempt. Reads,
 * and tools outside any workspace (opening an account, Ask), never wait.
 */
export function requiresApproval(spec: ApiToolSpec): boolean {
  return !spec.readOnly && spec.scope !== undefined && spec.approvalExempt !== true;
}

/** Keeps each spec's input type while collecting specs of different shapes in one list. */
export function defineTool<Shape extends z.ZodRawShape>(spec: ApiToolSpec<Shape>): ApiToolSpec {
  return spec as unknown as ApiToolSpec;
}

export function toText(value: unknown): string {
  return JSON.stringify(value, null, JSON_INDENTATION);
}

/** The refusal as the agent reads it: status, the API's code and message, and a next step. */
export function toRefusalText(spec: ApiToolSpec, error: CrossmartApiError): string {
  const reason = error.code ? `${error.status} ${error.code}` : String(error.status);
  const hint = spec.refusalHints?.[error.status as RefusalStatus];
  const refusal = `Crossmart refused (${reason}): ${error.message}`;
  return hint ? `${refusal}\n${hint}` : refusal;
}

/**
 * Makes the tool's API call. A refusal by the API is a result the agent reads, not an error;
 * anything else (the API unreachable) is thrown.
 */
export async function runApiTool(
  spec: ApiToolSpec,
  client: CrossmartApiClient,
  input: Record<string, unknown>,
): Promise<ApiToolResult> {
  try {
    const value = await client.call(spec.toCall(input as never));
    spec.afterCall?.(value, client);
    const shown = spec.toResult ? spec.toResult(value) : value;
    return { isError: false, text: toText(shown), value: shown };
  } catch (error) {
    if (!(error instanceof CrossmartApiError)) throw error;
    return { isError: true, text: toRefusalText(spec, error), status: error.status };
  }
}
