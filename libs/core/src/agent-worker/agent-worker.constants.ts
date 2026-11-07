import { MS_PER_HOUR, MS_PER_MINUTE } from '@crossmart/common';
import { AgentScope } from '../agents/enums/agent-scope.enum.js';

/**
 * Model calls one turn may make before it stops, however many tools the model still wants. Each
 * call is one AI credit, so this also caps what one message can cost.
 */
export const AGENT_WORKER_MAX_STEPS_PER_TURN = 8;
/** Output tokens one model call may write: room for reasoning, tool calls and a short answer. */
export const AGENT_WORKER_MAX_OUTPUT_TOKENS = 8_000;
/** Characters of one tool's answer the model reads; the rest is cut, with a note saying so. */
export const AGENT_WORKER_TOOL_RESULT_MAX_LENGTH = 16_000;
/** Characters of a before or after value an approval card shows. */
export const AGENT_WORKER_PREVIEW_VALUE_MAX_LENGTH = 2_000;

/** A person's message, in characters. */
export const AGENT_WORKER_MESSAGE_MIN_LENGTH = 1;
export const AGENT_WORKER_MESSAGE_MAX_LENGTH = 4_000;
/** A conversation's title, taken from its first message. */
export const AGENT_WORKER_TITLE_MAX_LENGTH = 80;
export const AGENT_WORKER_DEFAULT_TITLE = 'New conversation';
/** Conversations listed per page. */
export const AGENT_WORKER_DEFAULT_PAGE_SIZE = 20;
export const AGENT_WORKER_MAX_PAGE_SIZE = 50;

/**
 * Publishing more listings than this in one confirmation is a bulk action, as is a single call
 * that names more products than this: both need an explicit confirmation.
 */
export const AGENT_WORKER_BULK_THRESHOLD = 5;

/** A running turn not finished after this long is treated as abandoned (a crashed instance). */
export const AGENT_WORKER_TURN_STALE_MS = 10 * MS_PER_MINUTE;

/** What Agent Worker may reach, before the person's own role narrows it (ADR 0026). */
export const AGENT_WORKER_SCOPES: readonly AgentScope[] = [
  AgentScope.CatalogRead,
  AgentScope.CatalogWrite,
  AgentScope.OrdersRead,
  AgentScope.StoresWrite,
  AgentScope.ReportsRead,
  AgentScope.SuggestionsWrite,
];

/**
 * The header carrying Agent Worker's short-lived credential on its own calls to the API. Only
 * the API mints it, signed with a key derived from `BETTER_AUTH_SECRET`.
 */
export const AGENT_WORKER_TOKEN_HEADER = 'x-crossmart-agent-worker';
/** The token lives long enough for one tool call. */
export const AGENT_WORKER_TOKEN_TTL_SECONDS = 120;
export const AGENT_WORKER_TOKEN_AUDIENCE = 'crossmart:agent-worker';
export const AGENT_WORKER_TOKEN_ISSUER = 'crossmart-api';
/** What the token's signing key is derived for, so it is good for nothing else. */
export const AGENT_WORKER_TOKEN_KEY_CONTEXT = 'crossmart:agent-worker-token:v1';
export const AGENT_WORKER_TOKEN_ALGORITHM = 'HS256';
/** The token's claims. */
export const AGENT_WORKER_WORKSPACE_CLAIM = 'wid';
export const AGENT_WORKER_CONVERSATION_CLAIM = 'cid';

/**
 * Conversations are deleted this long after their last message (ADR 0026), like Ask's. The
 * worker's maintenance queue purges them daily, in batches.
 */
export const AGENT_WORKER_RETENTION_DAYS = 180;
export const AGENT_WORKER_RETENTION_BATCH_SIZE = 1_000;
export const AGENT_WORKER_RETENTION_MAX_BATCHES = 50;
export const AGENT_WORKER_RETENTION_INTERVAL_MS = 24 * MS_PER_HOUR;
export const AGENT_WORKER_RETENTION_JOB_NAME = 'agent-worker-retention';
export const AGENT_WORKER_RETENTION_SCHEDULER_ID = 'agent-worker-retention';

/** Messages shown to people. */
export const AGENT_WORKER_CONVERSATION_NOT_FOUND = 'Conversation not found';
export const AGENT_WORKER_TURN_IN_PROGRESS =
  'Agent Worker is still working on this conversation. Wait for it, or stop it first.';
export const AGENT_WORKER_NO_PENDING_ACTIONS =
  'Nothing in this conversation is waiting for approval';
export const AGENT_WORKER_UNKNOWN_ACTIONS = 'Some of these actions are not waiting for approval';
export const AGENT_WORKER_HIGH_RISK_NOT_CONFIRMED =
  'This includes a deletion, a price change or a bulk change. Confirm it explicitly to go on.';
export const AGENT_WORKER_STEP_LIMIT_REACHED =
  'Agent Worker stopped after its step limit for one message. Ask it to go on if needed.';
export const AGENT_WORKER_TURN_FAILED = 'Agent Worker could not finish. Try again in a moment.';
export const AGENT_WORKER_ANSWER_REFUSED = 'The model declined to answer this request.';
export const AGENT_WORKER_ANSWER_TRUNCATED = 'The answer was too long and was cut off.';
export const AGENT_WORKER_CANCELLED = 'Stopped.';
