import { Injectable } from '@nestjs/common';
import {
  type AgentWorkerAction,
  type AgentWorkerMessage,
  type Prisma,
  PrismaService,
} from '@crossmart/database';
import type { AiContentBlock } from '../../ai/entities/ai-conversation.js';
import type { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';

/** A message with its tool calls, oldest call first. */
export type AgentWorkerMessageRecord = AgentWorkerMessage & { actions: AgentWorkerAction[] };

export interface NewAgentWorkerMessage {
  conversationId: string;
  turnId: string;
  role: AgentWorkerRole;
  text: string;
  content: AiContentBlock[];
}

const OLDEST_FIRST = 'asc';
const WITH_ACTIONS = { actions: { orderBy: { createdAt: OLDEST_FIRST } } } as const;

/** The messages of Agent Worker conversations, in order. */
@Injectable()
export class AgentWorkerMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds a message at the next position. Only one turn runs per conversation, so positions
   * never race; the unique (conversation, position) index would refuse it if they did.
   */
  async append(message: NewAgentWorkerMessage): Promise<AgentWorkerMessageRecord> {
    const last = await this.prisma.agentWorkerMessage.findFirst({
      where: { conversationId: message.conversationId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return this.prisma.agentWorkerMessage.create({
      data: {
        ...message,
        position: (last?.position ?? 0) + 1,
        content: message.content as unknown as Prisma.InputJsonValue,
      },
      include: WITH_ACTIONS,
    });
  }

  /** Every message of the conversation with its tool calls, as the model reads them again. */
  listOfConversation(conversationId: string): Promise<AgentWorkerMessageRecord[]> {
    return this.prisma.agentWorkerMessage.findMany({
      where: { conversationId },
      orderBy: { position: OLDEST_FIRST },
      include: WITH_ACTIONS,
    });
  }
}
