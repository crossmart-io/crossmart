import { Injectable } from '@nestjs/common';
import { type AgentWorkerTurn, PrismaService } from '@crossmart/database';
import type { AiTokenUsage } from '../../ai/entities/ai-completion.js';
import { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import type { AgentWorkerTurnTrigger } from '../enums/agent-worker-turn-trigger.enum.js';

/** How a turn ended. */
export interface AgentWorkerTurnEnding {
  status: AgentWorkerTurnStatus;
  failureReason?: string | null;
}

const NEWEST_FIRST = 'desc';
const ACTIVE_STATUSES = [AgentWorkerTurnStatus.Running, AgentWorkerTurnStatus.AwaitingApproval];

/** The runs of Agent Worker's loop, with what each spent. */
@Injectable()
export class AgentWorkerTurnRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(conversationId: string, trigger: AgentWorkerTurnTrigger): Promise<AgentWorkerTurn> {
    return this.prisma.agentWorkerTurn.create({
      data: { conversationId, trigger, status: AgentWorkerTurnStatus.Running },
    });
  }

  delete(turnId: string): Promise<AgentWorkerTurn> {
    return this.prisma.agentWorkerTurn.delete({ where: { id: turnId } });
  }

  /** Adds one model call and its tokens to the turn. */
  async recordModelCall(turnId: string, model: string, usage: AiTokenUsage): Promise<void> {
    await this.prisma.agentWorkerTurn.update({
      where: { id: turnId },
      data: {
        model,
        modelCalls: { increment: 1 },
        inputTokens: { increment: usage.inputTokens },
        outputTokens: { increment: usage.outputTokens },
      },
    });
  }

  finish(turnId: string, ending: AgentWorkerTurnEnding): Promise<AgentWorkerTurn> {
    const done = ending.status !== AgentWorkerTurnStatus.AwaitingApproval;
    return this.prisma.agentWorkerTurn.update({
      where: { id: turnId },
      data: {
        status: ending.status,
        failureReason: ending.failureReason ?? null,
        ...(done ? { finishedAt: new Date() } : {}),
      },
    });
  }

  /** A turn still waiting for approval is over once the person decides or moves on. */
  async closeAwaitingApproval(conversationId: string): Promise<void> {
    await this.prisma.agentWorkerTurn.updateMany({
      where: { conversationId, status: AgentWorkerTurnStatus.AwaitingApproval },
      data: { status: AgentWorkerTurnStatus.Completed, finishedAt: new Date() },
    });
  }

  async requestCancel(turnId: string): Promise<void> {
    await this.prisma.agentWorkerTurn.updateMany({
      where: { id: turnId, status: AgentWorkerTurnStatus.Running },
      data: { cancelRequestedAt: new Date() },
    });
  }

  async isCancelRequested(turnId: string): Promise<boolean> {
    const turn = await this.prisma.agentWorkerTurn.findUnique({
      where: { id: turnId },
      select: { cancelRequestedAt: true },
    });
    return Boolean(turn?.cancelRequestedAt);
  }

  /** The conversation's newest turn that is running or waiting for approval. */
  findActive(conversationId: string): Promise<AgentWorkerTurn | null> {
    return this.prisma.agentWorkerTurn.findFirst({
      where: { conversationId, status: { in: ACTIVE_STATUSES } },
      orderBy: { startedAt: NEWEST_FIRST },
    });
  }
}
