import { Injectable } from '@nestjs/common';
import { AGENT_WORKER_DEFAULT_TITLE } from '../agent-worker.constants.js';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import type { AgentWorkerConversationQuery } from '../entities/agent-worker-requests.js';
import type {
  AgentWorkerConversationDetail,
  AgentWorkerConversationPage,
  AgentWorkerConversationView,
} from '../entities/agent-worker-views.js';
import { AgentWorkerConversationNotFoundError } from '../errors/agent-worker.errors.js';
import { toConversationView, toMessageView, toTurnView } from '../mappers/agent-worker.mapper.js';
import { AgentWorkerToolbox } from '../tools/agent-worker-toolbox.js';
import { AgentWorkerStore } from './agent-worker-store.js';

/** A person's Agent Worker conversations in a workspace: starting, listing, reading, deleting. */
@Injectable()
export class AgentWorkerConversationsService {
  constructor(
    private readonly store: AgentWorkerStore,
    private readonly toolbox: AgentWorkerToolbox,
  ) {}

  async create(owner: AgentWorkerOwner, title?: string): Promise<AgentWorkerConversationView> {
    const created = await this.store.conversations.create(
      owner,
      title ?? AGENT_WORKER_DEFAULT_TITLE,
    );
    return toConversationView(created);
  }

  async list(
    owner: AgentWorkerOwner,
    query: AgentWorkerConversationQuery,
  ): Promise<AgentWorkerConversationPage> {
    const { items, total } = await this.store.conversations.listOfOwner(owner, {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items: items.map(toConversationView), total };
  }

  async get(
    owner: AgentWorkerOwner,
    conversationId: string,
  ): Promise<AgentWorkerConversationDetail> {
    const conversation = await this.store.requireConversation(owner, conversationId);
    const [messages, activeTurn] = await Promise.all([
      this.store.messages.listOfConversation(conversation.id),
      this.store.turns.findActive(conversation.id),
    ]);
    const titleOf = (toolName: string): string => this.toolbox.titleOf(toolName);
    return {
      conversation: toConversationView(conversation),
      messages: messages.map((message) => toMessageView(message, titleOf)),
      activeTurn: activeTurn ? toTurnView(activeTurn) : null,
    };
  }

  async delete(owner: AgentWorkerOwner, conversationId: string): Promise<void> {
    if (!(await this.store.conversations.deleteOfOwner(owner, conversationId))) {
      throw new AgentWorkerConversationNotFoundError();
    }
  }
}
