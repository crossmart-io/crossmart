import { Injectable } from '@nestjs/common';
import { type AgentWorkerAction, type Prisma, PrismaService } from '@crossmart/database';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import type { AgentWorkerActionRisk } from '../enums/agent-worker-action-risk.enum.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import type { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';

export interface NewAgentWorkerAction {
  conversationId: string;
  messageId: string;
  toolUseId: string;
  toolName: string;
  kind: AgentWorkerToolKind;
  status: AgentWorkerActionStatus;
  input: Record<string, unknown>;
  summary: string;
  risks?: AgentWorkerActionRisk[];
  preview?: AgentWorkerActionPreview | null;
  result?: string | null;
  resultIsError?: boolean;
  untrustedWarning?: boolean;
}

/** What a finished call gave the model. */
export interface AgentWorkerActionOutcome {
  status: AgentWorkerActionStatus;
  result: string;
  resultIsError: boolean;
  summary?: string;
}

const OLDEST_FIRST = 'asc';

/** Agent Worker's tool calls: reads that ran, and changes waiting for or given a decision. */
@Injectable()
export class AgentWorkerActionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(action: NewAgentWorkerAction): Promise<AgentWorkerAction> {
    const { preview, input, ...rest } = action;
    return this.prisma.agentWorkerAction.create({
      data: {
        ...rest,
        input: input as Prisma.InputJsonValue,
        ...(preview ? { preview: preview as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  finish(actionId: string, outcome: AgentWorkerActionOutcome): Promise<AgentWorkerAction> {
    const executed = outcome.status === AgentWorkerActionStatus.Executed;
    return this.prisma.agentWorkerAction.update({
      where: { id: actionId },
      data: { ...outcome, ...(executed ? { executedAt: new Date() } : {}) },
    });
  }

  /** The conversation's changes waiting for approval, in the order they were proposed. */
  listPending(conversationId: string): Promise<AgentWorkerAction[]> {
    return this.prisma.agentWorkerAction.findMany({
      where: { conversationId, status: AgentWorkerActionStatus.Proposed },
      orderBy: { createdAt: OLDEST_FIRST },
    });
  }

  /**
   * Moves pending actions to a decided status, only while they are still pending: a
   * conditional update, so two decisions at once never both apply a change.
   */
  async decide(
    actionIds: string[],
    status: AgentWorkerActionStatus,
    decidedByUserId: string | null,
  ): Promise<number> {
    if (actionIds.length === 0) return 0;
    const { count } = await this.prisma.agentWorkerAction.updateMany({
      where: { id: { in: actionIds }, status: AgentWorkerActionStatus.Proposed },
      data: { status, decidedByUserId, decidedAt: new Date() },
    });
    return count;
  }

  /** Every change still waiting in the conversation is dropped, such as when the person moves on. */
  async expirePending(conversationId: string): Promise<number> {
    const { count } = await this.prisma.agentWorkerAction.updateMany({
      where: { conversationId, status: AgentWorkerActionStatus.Proposed },
      data: { status: AgentWorkerActionStatus.Expired, decidedAt: new Date() },
    });
    return count;
  }

  findById(actionId: string): Promise<AgentWorkerAction | null> {
    return this.prisma.agentWorkerAction.findUnique({ where: { id: actionId } });
  }
}
