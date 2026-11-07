import { Injectable } from '@nestjs/common';
import { type AgentWorkerConversation, PrismaService } from '@crossmart/database';
import type { AgentWorkerOwner } from '../entities/agent-worker-owner.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';

/** A conversation with how many changes wait in it. */
export type AgentWorkerConversationRecord = AgentWorkerConversation & {
  pendingActionCount: number;
};

const NEWEST_FIRST = 'desc';
/** Counts each conversation's changes waiting for approval along with it. */
const WITH_PENDING_COUNT = {
  _count: { select: { actions: { where: { status: AgentWorkerActionStatus.Proposed } } } },
} as const;

/**
 * Agent Worker's conversations. Every read and write names the owner (workspace and person), so
 * a conversation is unreachable from anyone else's session, whatever id they send.
 */
@Injectable()
export class AgentWorkerConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(owner: AgentWorkerOwner, title: string): Promise<AgentWorkerConversationRecord> {
    const created = await this.prisma.agentWorkerConversation.create({
      data: { workspaceId: owner.workspaceId, userId: owner.userId, title },
    });
    return { ...created, pendingActionCount: 0 };
  }

  async findOfOwner(
    owner: AgentWorkerOwner,
    conversationId: string,
  ): Promise<AgentWorkerConversationRecord | null> {
    const found = await this.prisma.agentWorkerConversation.findFirst({
      where: { id: conversationId, workspaceId: owner.workspaceId, userId: owner.userId },
      include: WITH_PENDING_COUNT,
    });
    return found ? this.toRecord(found) : null;
  }

  /** The owner's conversations, most recently active first. */
  async listOfOwner(
    owner: AgentWorkerOwner,
    page: { skip: number; take: number },
  ): Promise<{ items: AgentWorkerConversationRecord[]; total: number }> {
    const where = { workspaceId: owner.workspaceId, userId: owner.userId };
    const [rows, total] = await Promise.all([
      this.prisma.agentWorkerConversation.findMany({
        where,
        include: WITH_PENDING_COUNT,
        orderBy: [{ lastActivityAt: NEWEST_FIRST }, { id: NEWEST_FIRST }],
        ...page,
      }),
      this.prisma.agentWorkerConversation.count({ where }),
    ]);
    return { items: rows.map((row) => this.toRecord(row)), total };
  }

  async deleteOfOwner(owner: AgentWorkerOwner, conversationId: string): Promise<boolean> {
    const { count } = await this.prisma.agentWorkerConversation.deleteMany({
      where: { id: conversationId, workspaceId: owner.workspaceId, userId: owner.userId },
    });
    return count > 0;
  }

  /**
   * Makes `turnId` the conversation's running turn, unless another runs: a conditional update,
   * so two requests at once never both start. A turn older than `staleBefore` is taken over.
   */
  async claimTurn(conversationId: string, turnId: string, staleBefore: Date): Promise<boolean> {
    const { count } = await this.prisma.agentWorkerConversation.updateMany({
      where: {
        id: conversationId,
        OR: [{ runningTurnId: null }, { runningTurnStartedAt: { lt: staleBefore } }],
      },
      data: { runningTurnId: turnId, runningTurnStartedAt: new Date() },
    });
    return count > 0;
  }

  async releaseTurn(conversationId: string, turnId: string): Promise<void> {
    await this.prisma.agentWorkerConversation.updateMany({
      where: { id: conversationId, runningTurnId: turnId },
      data: { runningTurnId: null, runningTurnStartedAt: null },
    });
  }

  async touch(conversationId: string, title?: string): Promise<void> {
    await this.prisma.agentWorkerConversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date(), ...(title ? { title } : {}) },
    });
  }

  /** Deletes up to `limit` conversations idle since before `cutoff`, with everything in them. */
  deleteIdleBefore(cutoff: Date, limit: number): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM agent_worker_conversations
      WHERE id IN (
        SELECT id FROM agent_worker_conversations
        WHERE last_activity_at < ${cutoff}
        LIMIT ${limit}
      )`;
  }

  private toRecord(
    row: AgentWorkerConversation & { _count: { actions: number } },
  ): AgentWorkerConversationRecord {
    const { _count: counts, ...conversation } = row;
    return { ...conversation, pendingActionCount: counts.actions };
  }
}
