import { z } from 'zod';
import type { McpCaller } from './mcp-caller.js';
import { LoggedJsonRpcMethod } from './mcp-log.constants.js';
import type { McpRequestLog } from './mcp-request-log.js';

/** The parts of a JSON-RPC message the log reads; anything else in it is never looked at. */
const LOGGED_MESSAGE = z.object({
  method: z.string(),
  params: z
    .object({
      protocolVersion: z.string().optional(),
      clientInfo: z
        .object({ name: z.string().optional(), version: z.string().optional() })
        .optional(),
    })
    .optional(),
});

function logMessage(log: McpRequestLog, caller: McpCaller, message: unknown): void {
  const parsed = LOGGED_MESSAGE.safeParse(message);
  if (!parsed.success) return;
  const { method, params } = parsed.data;
  if (method === LoggedJsonRpcMethod.ToolsList) log.toolsList(caller);
  if (method !== LoggedJsonRpcMethod.Initialize) return;
  log.initialize(caller, {
    clientName: params?.clientInfo?.name,
    clientVersion: params?.clientInfo?.version,
    protocolVersion: params?.protocolVersion,
  });
}

/**
 * Logs the session openings and tool-list reads of a request body (one message or a batch).
 * Tool calls are logged when they finish, with their outcome, by the tool wrapper.
 */
export function logJsonRpcRequest(log: McpRequestLog, caller: McpCaller, body: unknown): void {
  const messages: unknown[] = Array.isArray(body) ? body : [body];
  for (const message of messages) logMessage(log, caller, message);
}
