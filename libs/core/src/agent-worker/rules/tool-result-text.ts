import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { fenceToolOutput } from './untrusted-text.js';

/** What the model reads for a call, by how it ended, before any stored result. */
const STATUS_PREFIXES: Partial<Record<AgentWorkerActionStatus, string>> = {
  [AgentWorkerActionStatus.Rejected]:
    'The person rejected this change, so it was not made. Do not propose it again unless they ask.',
  [AgentWorkerActionStatus.Expired]:
    'The person moved on without approving this change, so it was not made.',
  [AgentWorkerActionStatus.Cancelled]: 'The person stopped the turn before this call ran.',
  [AgentWorkerActionStatus.Executed]: 'The person approved this change and it was made.',
  [AgentWorkerActionStatus.ExecutionFailed]:
    'The person approved this change, but Crossmart refused it.',
};

/** Calls that ended in a way the model must not read as done. */
const ERROR_STATUSES: ReadonlySet<AgentWorkerActionStatus> = new Set([
  AgentWorkerActionStatus.Failed,
  AgentWorkerActionStatus.Refused,
  AgentWorkerActionStatus.Rejected,
  AgentWorkerActionStatus.Expired,
  AgentWorkerActionStatus.Cancelled,
  AgentWorkerActionStatus.ExecutionFailed,
]);

const NOT_FINISHED = 'This call did not finish, so nothing is known about its result.';

export interface ToolResultText {
  content: string;
  isError: boolean;
}

/** A call as the transcript needs it. */
export interface ToolCallState {
  toolName: string;
  status: AgentWorkerActionStatus;
  /** What the API answered, as stored; null when the call never reached it. */
  result: string | null;
}

/**
 * The tool result the model reads for a call: what became of it, then the API's answer fenced
 * as untrusted data.
 */
export function toolResultText({ toolName, status, result }: ToolCallState): ToolResultText {
  const prefix = STATUS_PREFIXES[status];
  const output = result ? fenceToolOutput(toolName, result) : null;
  const parts = [prefix, output].filter((part): part is string => Boolean(part));
  return {
    content: parts.length > 0 ? parts.join('\n') : NOT_FINISHED,
    isError: ERROR_STATUSES.has(status) || parts.length === 0,
  };
}
