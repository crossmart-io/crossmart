import type {
  BetaFallbacksParam,
  BetaStopReason,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { AiStopReason } from '../../enums/ai-stop-reason.enum.js';

/**
 * Reasoning effort for agent calls. Short copywriting tasks gain little from more; `medium`
 * keeps quality while bounding cost and latency.
 */
export const ANTHROPIC_EFFORT = 'medium';

/** A call that has not answered by then is abandoned (and retried by the SDK). */
export const ANTHROPIC_TIMEOUT_MS = 120_000;
/** The SDK retries rate limits, overloads and network errors this many times. */
export const ANTHROPIC_MAX_RETRIES = 2;

/**
 * Server-side refusal fallback: when the model declines, the API re-runs the request on a
 * model chosen for the refusal's category, within the same call. Only some models take it.
 */
export const REFUSAL_FALLBACK_BETA = 'server-side-fallback-2026-07-01';
export const REFUSAL_FALLBACKS: BetaFallbacksParam = 'default';
export const REFUSAL_FALLBACK_MODELS: ReadonlySet<string> = new Set([
  'claude-sonnet-5-5',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-fable-5-1',
]);

/** How Anthropic's stop reasons read for Crossmart; any other reason is a completed answer. */
export const ANTHROPIC_STOP_REASONS: Partial<Record<BetaStopReason, AiStopReason>> = {
  refusal: AiStopReason.Refused,
  max_tokens: AiStopReason.Truncated,
  model_context_window_exceeded: AiStopReason.Truncated,
};

/** How Anthropic's stop reasons read in a conversation with tools. */
export const ANTHROPIC_CONVERSATION_STOP_REASONS: Partial<Record<BetaStopReason, AiStopReason>> = {
  ...ANTHROPIC_STOP_REASONS,
  tool_use: AiStopReason.ToolUse,
};

/**
 * Prompt caching for conversations: the tools, the system prompt and the history so far are
 * cached, so each step of a tool loop pays full price only for what is new.
 */
export const ANTHROPIC_CONVERSATION_CACHE = { type: 'ephemeral' } as const;

export const TEXT_BLOCK_TYPE = 'text';
export const TOOL_USE_BLOCK_TYPE = 'tool_use';
export const TOOL_RESULT_BLOCK_TYPE = 'tool_result';
export const USER_ROLE = 'user';
