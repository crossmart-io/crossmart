import type { AiContentBlockType } from '../enums/ai-content-block-type.enum.js';
import type { AiConversationRole } from '../enums/ai-conversation-role.enum.js';
import type { AiFeature } from '../enums/ai-feature.enum.js';
import type { AiProviderName } from '../enums/ai-provider-name.enum.js';
import type { AiStopReason } from '../enums/ai-stop-reason.enum.js';
import type { AiTokenUsage } from './ai-completion.js';

export interface AiTextBlock {
  type: AiContentBlockType.Text;
  text: string;
}

/** The model asks for `name` to run with `input`; the result must answer `id`. */
export interface AiToolUseBlock {
  type: AiContentBlockType.ToolUse;
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** What a tool gave back. Its content is data the model reads, never instructions. */
export interface AiToolResultBlock {
  type: AiContentBlockType.ToolResult;
  toolUseId: string;
  content: string;
  isError: boolean;
}

/** A provider's own block (such as reasoning), replayed to that provider as it came. */
export interface AiProviderSpecificBlock {
  type: AiContentBlockType.ProviderSpecific;
  provider: AiProviderName;
  value: unknown;
}

export type AiContentBlock =
  AiTextBlock | AiToolUseBlock | AiToolResultBlock | AiProviderSpecificBlock;

export interface AiConversationMessage {
  role: AiConversationRole;
  content: AiContentBlock[];
}

/** A tool the model may ask for, described by a JSON Schema of its input. */
export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** One model call of a conversation with tools. Messages are only ever appended to. */
export interface AiConversationRequest {
  system: string;
  messages: AiConversationMessage[];
  tools: AiToolDefinition[];
  maxOutputTokens: number;
  /** A model for this call only, such as Agent Worker's own. */
  model?: string;
  /** Aborts the call, such as when the person stops the turn. */
  signal?: AbortSignal;
}

/** Receives the answer's text as the model writes it. */
export interface AiConversationListener {
  onTextDelta(delta: string): void;
}

/** The model's whole answer to one call. */
export interface AiConversationReply {
  content: AiContentBlock[];
  model: string;
  stopReason: AiStopReason;
  usage: AiTokenUsage;
}

/** Who a conversation call is for and what it does, for metering. */
export interface AiConversationContext {
  workspaceId: string;
  feature: AiFeature;
}
