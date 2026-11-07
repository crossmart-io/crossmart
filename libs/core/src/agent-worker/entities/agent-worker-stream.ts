import type { AgentWorkerErrorCode } from '../enums/agent-worker-error-code.enum.js';
import type { AgentWorkerEventType } from '../enums/agent-worker-event-type.enum.js';
import type {
  AgentWorkerActionView,
  AgentWorkerMessageView,
  AgentWorkerTurnView,
} from './agent-worker-views.js';

export interface AgentWorkerErrorView {
  code: AgentWorkerErrorCode;
  message: string;
}

/** One event of a streamed turn. `type` says which of the other fields it carries. */
export interface AgentWorkerStreamEvent {
  type: AgentWorkerEventType;
  turn?: AgentWorkerTurnView;
  delta?: string;
  message?: AgentWorkerMessageView;
  action?: AgentWorkerActionView;
  error?: AgentWorkerErrorView;
}

/** Where a turn's events go: the HTTP response's event stream, or a test's list. */
export interface AgentWorkerEventSink {
  emit(event: AgentWorkerStreamEvent): void;
}
