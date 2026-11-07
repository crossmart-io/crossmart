import type { AgentWorkerAction } from '@crossmart/database';
import type {
  AiContentBlock,
  AiConversationMessage,
  AiToolResultBlock,
  AiToolUseBlock,
} from '../../ai/entities/ai-conversation.js';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiConversationRole } from '../../ai/enums/ai-conversation-role.enum.js';
import { findEnumValue } from '@crossmart/common';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import { parseStoredContent } from './stored-content.js';
import { toolResultText } from './tool-result-text.js';

function toolUses(content: AiContentBlock[]): AiToolUseBlock[] {
  return content.filter(
    (block): block is AiToolUseBlock => block.type === AiContentBlockType.ToolUse,
  );
}

function resultFor(use: AiToolUseBlock, actions: AgentWorkerAction[]): AiToolResultBlock {
  const action = actions.find((candidate) => candidate.toolUseId === use.id);
  const status = findEnumValue(AgentWorkerActionStatus, action?.status ?? '');
  const { content, isError } = toolResultText({
    toolName: use.name,
    status: status ?? AgentWorkerActionStatus.Running,
    result: status ? (action?.result ?? null) : null,
  });
  return { type: AiContentBlockType.ToolResult, toolUseId: use.id, content, isError };
}

/** Appends user content, merged into the previous message when that one is the user's too. */
function appendUser(transcript: AiConversationMessage[], content: AiContentBlock[]): void {
  if (content.length === 0) return;
  const last = transcript.at(-1);
  if (last?.role === AiConversationRole.User) {
    last.content.push(...content);
    return;
  }
  transcript.push({ role: AiConversationRole.User, content });
}

/**
 * The conversation as the model reads it again. Assistant messages are replayed as the model
 * wrote them; each of their tool calls is answered, in the next user message, by what became of
 * it (its result, or that it was rejected, expired or stopped). The transcript only ever grows:
 * a call is sent back only once it is final, so earlier turns never change.
 */
export function buildTranscript(messages: AgentWorkerMessageRecord[]): AiConversationMessage[] {
  const transcript: AiConversationMessage[] = [];
  for (const message of messages) {
    const content = parseStoredContent(message.content);
    if (message.role !== AgentWorkerRole.Assistant) {
      appendUser(transcript, content);
      continue;
    }
    if (content.length === 0) continue;
    transcript.push({ role: AiConversationRole.Assistant, content });
    appendUser(
      transcript,
      toolUses(content).map((use) => resultFor(use, message.actions)),
    );
  }
  return transcript;
}
