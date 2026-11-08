import { Injectable } from '@nestjs/common';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import { AgentWorkerConversationNotFoundError } from '../errors/agent-worker.errors.js';
import { AgentWorkerActionRepository } from '../repositories/agent-worker-action.repository.js';
import {
  type AgentWorkerConversationRecord,
  AgentWorkerConversationRepository,
} from '../repositories/agent-worker-conversation.repository.js';
import { AgentWorkerMessageRepository } from '../repositories/agent-worker-message.repository.js';
import { AgentWorkerTurnRepository } from '../repositories/agent-worker-turn.repository.js';

/** Agent Worker's stored state in one place: conversations, turns, messages and tool calls. */
@Injectable()
export class AgentWorkerStore {
  constructor(
    readonly conversations: AgentWorkerConversationRepository,
    readonly turns: AgentWorkerTurnRepository,
    readonly messages: AgentWorkerMessageRepository,
    readonly actions: AgentWorkerActionRepository,
  ) {}

  /** The owner's conversation, or 404 for an unknown id and for anyone else's. */
  async requireConversation(
    owner: AgentWorkerOwner,
    conversationId: string,
  ): Promise<AgentWorkerConversationRecord> {
    const conversation = await this.conversations.findOfOwner(owner, conversationId);
    if (!conversation) throw new AgentWorkerConversationNotFoundError();
    return conversation;
  }
}
