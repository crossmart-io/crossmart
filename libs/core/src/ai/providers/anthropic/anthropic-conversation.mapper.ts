import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaTool,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type {
  AiContentBlock,
  AiConversationMessage,
  AiConversationReply,
  AiToolDefinition,
} from '../../entities/ai-conversation.js';
import { AiContentBlockType } from '../../enums/ai-content-block-type.enum.js';
import { AiProviderName } from '../../enums/ai-provider-name.enum.js';
import { AiStopReason } from '../../enums/ai-stop-reason.enum.js';
import {
  ANTHROPIC_CONVERSATION_STOP_REASONS,
  TEXT_BLOCK_TYPE,
  TOOL_RESULT_BLOCK_TYPE,
  TOOL_USE_BLOCK_TYPE,
} from './anthropic.constants.js';

type ToolInputSchema = BetaTool['input_schema'];

function toBlockParam(block: AiContentBlock): BetaContentBlockParam {
  switch (block.type) {
    case AiContentBlockType.Text:
      return { type: TEXT_BLOCK_TYPE, text: block.text };
    case AiContentBlockType.ToolUse:
      return { type: TOOL_USE_BLOCK_TYPE, id: block.id, name: block.name, input: block.input };
    case AiContentBlockType.ToolResult:
      return {
        type: TOOL_RESULT_BLOCK_TYPE,
        tool_use_id: block.toolUseId,
        content: block.content,
        is_error: block.isError,
      };
    case AiContentBlockType.ProviderSpecific:
      // Replayed exactly as Anthropic sent it (reasoning blocks must come back unchanged).
      return block.value as BetaContentBlockParam;
  }
}

/** The conversation as the Messages API takes it. */
export function toAnthropicMessages(messages: AiConversationMessage[]): BetaMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.map(toBlockParam),
  }));
}

export function toAnthropicTools(tools: AiToolDefinition[]): BetaTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as ToolInputSchema,
  }));
}

function fromBlock(block: BetaContentBlock): AiContentBlock {
  if (block.type === TEXT_BLOCK_TYPE) {
    return { type: AiContentBlockType.Text, text: block.text };
  }
  if (block.type === TOOL_USE_BLOCK_TYPE) {
    const input = (block.input ?? {}) as Record<string, unknown>;
    return { type: AiContentBlockType.ToolUse, id: block.id, name: block.name, input };
  }
  return {
    type: AiContentBlockType.ProviderSpecific,
    provider: AiProviderName.Anthropic,
    value: block,
  };
}

/** The model's answer, provider-neutral, with every block kept for the next call. */
export function fromAnthropicMessage(message: BetaMessage): AiConversationReply {
  const reason = message.stop_reason;
  return {
    content: message.content.map(fromBlock),
    model: message.model,
    stopReason: (reason && ANTHROPIC_CONVERSATION_STOP_REASONS[reason]) ?? AiStopReason.Completed,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };
}
