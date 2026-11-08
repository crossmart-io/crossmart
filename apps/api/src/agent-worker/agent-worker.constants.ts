import { MS_PER_MINUTE } from '@crossmart/common';

export const AGENT_WORKER_TAG = 'Agent Worker';
export const AGENT_WORKER_ROUTE = 'workspaces/:workspaceId/agent-worker/conversations';
/** Named `conversationId` in `AgentWorkerConversationParamsDto`. */
export const CONVERSATION_PATH = ':conversationId';
export const MESSAGES_PATH = `${CONVERSATION_PATH}/messages`;
export const DECISION_PATH = `${CONVERSATION_PATH}/decision`;
export const CANCEL_PATH = `${CONVERSATION_PATH}/cancel`;

/** Schema names the generated clients use for Agent Worker's enums. */
export const AGENT_WORKER_ROLE_SCHEMA_NAME = 'AgentWorkerRole';
export const AGENT_WORKER_TURN_STATUS_SCHEMA_NAME = 'AgentWorkerTurnStatus';
export const AGENT_WORKER_TURN_TRIGGER_SCHEMA_NAME = 'AgentWorkerTurnTrigger';
export const AGENT_WORKER_ACTION_STATUS_SCHEMA_NAME = 'AgentWorkerActionStatus';
export const AGENT_WORKER_ACTION_RISK_SCHEMA_NAME = 'AgentWorkerActionRisk';
export const AGENT_WORKER_TOOL_KIND_SCHEMA_NAME = 'AgentWorkerToolKind';
export const AGENT_WORKER_EVENT_TYPE_SCHEMA_NAME = 'AgentWorkerEventType';
export const AGENT_WORKER_ERROR_CODE_SCHEMA_NAME = 'AgentWorkerErrorCode';
export const AGENT_WORKER_CONTEXT_VIEW_SCHEMA_NAME = 'AgentWorkerContextView';

/**
 * Turns (messages and decisions) a workspace may start per window, whoever starts them, on top
 * of the plan's AI credits: a stuck client or a script cannot run up the bill in a burst.
 */
export const AGENT_WORKER_THROTTLE_WINDOW_MS = MS_PER_MINUTE;
export const AGENT_WORKER_TURNS_PER_WINDOW = 20;
export const AGENT_WORKER_RATE_LIMITED_MESSAGE =
  'Crossmart Agent is getting too many requests in this workspace. Wait a minute and try again.';

/** The event stream a turn answers with. */
export const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';
export const TURN_STREAM_DESCRIPTION =
  'A stream of server-sent events, one `AgentWorkerStreamEventDto` per event as JSON in its ' +
  '`data` field (the event name is the `type`). It starts with `turn_started` and ends with ' +
  '`turn_finished`; the turn status there says how it ended.';
