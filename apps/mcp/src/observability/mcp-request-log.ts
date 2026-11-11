import { Logger } from '@nestjs/common';
import type { McpCaller } from './mcp-caller.js';
import { type LogValue, logLine } from './log-line.js';
import {
  CLIENT_VALUE_MAX_LENGTH,
  MCP_LOG_CONTEXT,
  McpLogEvent,
  type ToolCallOutcome,
} from './mcp-log.constants.js';

/** Where the lines go: Nest's logger, as in the rest of the codebase. */
export interface LineLogger {
  log(message: string): void;
  warn(message: string): void;
}

/** How one tool call went. Never its arguments or what it returned, only a count. */
export interface ToolCallRecord {
  tool: string;
  outcome: ToolCallOutcome;
  durationMs: number;
  /** The HTTP status of a refusal. */
  status?: number;
  /** The API's reason for a refusal, such as `sandbox_claim_required`. */
  code?: string;
  /** How many items a list returned. */
  items?: number;
  /** The workspace, when the call learned it (an API key's). */
  workspaceId?: string;
}

/** Told about each tool call a server bound to one request makes. */
export interface ToolCallObserver {
  toolCalled(record: ToolCallRecord): void;
}

/** What a client says about itself when it opens a session. */
export interface ClientHello {
  clientName?: string;
  clientVersion?: string;
  protocolVersion?: string;
}

/** A value the client chose, cut short. */
function clientValue(value: string | undefined): string | undefined {
  return value?.slice(0, CLIENT_VALUE_MAX_LENGTH);
}

function callerFields(caller: McpCaller): Record<string, LogValue> {
  return {
    caller: caller.kind,
    principal: caller.principalId,
    client: caller.clientId,
    workspace: caller.workspaceId,
  };
}

/**
 * The remote server's request log: one line per session opened, tool list read and tool called,
 * so operators can see what agents try. Lines carry ids, names, outcomes and counts only: never
 * arguments, results, prompts, tokens, emails or request bodies.
 */
export class McpRequestLog {
  constructor(private readonly logger: LineLogger = new Logger(MCP_LOG_CONTEXT)) {}

  initialize(caller: McpCaller, hello: ClientHello): void {
    this.logger.log(
      logLine({
        event: McpLogEvent.Initialize,
        clientName: clientValue(hello.clientName),
        clientVersion: clientValue(hello.clientVersion),
        protocol: clientValue(hello.protocolVersion),
        ...callerFields(caller),
      }),
    );
  }

  toolsList(caller: McpCaller): void {
    this.logger.log(logLine({ event: McpLogEvent.ToolsList, ...callerFields(caller) }));
  }

  toolCall(caller: McpCaller, record: ToolCallRecord): void {
    const { tool, outcome, status, code, items, durationMs } = record;
    const fields = callerFields({
      ...caller,
      workspaceId: caller.workspaceId ?? record.workspaceId,
    });
    this.logger.log(
      logLine({
        event: McpLogEvent.ToolCall,
        tool,
        outcome,
        status,
        code,
        items,
        durationMs,
        ...fields,
      }),
    );
  }

  /** A body that is not JSON: one line, without the body, which may hold a token. */
  parseError(): void {
    this.logger.warn(logLine({ event: McpLogEvent.ParseError }));
  }

  /** An observer that logs each tool call as `caller`'s. */
  observerFor(caller: McpCaller): ToolCallObserver {
    return { toolCalled: (record) => this.toolCall(caller, record) };
  }
}
