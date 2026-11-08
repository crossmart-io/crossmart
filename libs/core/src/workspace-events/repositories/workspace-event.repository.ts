import { Injectable } from '@nestjs/common';
import {
  type AgentWorkerAction,
  type AgentWorkerTurn,
  type Prisma,
  PrismaService,
  WebhookDeliveryStatus,
} from '@crossmart/database';
import { SortDirection, sortWithTiebreak } from '@crossmart/common';
import {
  ACTIVITY_EVENT_INCLUDE,
  type ActivityEventRecord,
} from '../../activity/repositories/activity-event.queries.js';
import {
  AGENT_PROPOSAL_INCLUDE,
  type AgentProposalRecord,
} from '../../agent-proposals/repositories/agent-proposal.queries.js';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import { AgentWorkerTurnStatus } from '../../agent-worker/enums/agent-worker-turn-status.enum.js';
import type { SourceWindow, TieCondition, TimeCondition } from '../rules/source-window.js';
import {
  FAILED_DELIVERY_SELECT,
  type FailedDeliveryRecord,
  ORDER_EVENT_SELECT,
  type OrderEventRecord,
} from './workspace-event.queries.js';

type RangeOn<Field extends string> = Record<Field, TimeCondition>;
type TieOn<Field extends string> = Record<Field, Date> & { id: { gt: string } };

/** Rows of a window on one timestamp column: in its range, or tied with the last position. */
function windowWhere<Field extends string>(
  field: Field,
  window: SourceWindow,
): RangeOn<Field> | { OR: [RangeOn<Field>, TieOn<Field>] } {
  const range = { [field]: window.time() } as RangeOn<Field>;
  const tie: TieCondition | null = window.tie();
  if (!tie) return range;
  const tied = { [field]: tie.time, id: { gt: tie.idAfter } } as TieOn<Field>;
  return { OR: [range, tied] };
}

/** Which of the reader's tool calls to read: those with a step in the range, at most `limit`. */
export interface AgentStepQuery {
  conversationIds: string[];
  since: Date;
  until: Date;
  limit: number;
  direction: SortDirection;
}

/** Which outside agents' proposals to read: those with a step in the range, at most `limit`. */
export interface ProposalStepQuery {
  workspaceId: string;
  since: Date;
  until: Date;
  limit: number;
  direction: SortDirection;
}

/** A time range on any step's column, for records with an event per step. */
function anyStepIn(since: Date, until: Date): Prisma.AgentWorkerActionWhereInput[] {
  const range = { gte: since, lte: until };
  return [{ createdAt: range }, { decidedAt: range }, { finishedAt: range }];
}

/**
 * Reads what the workspace event stream is made of. Every query names the workspace (or, for
 * Crossmart Agent, the reader's own conversations in it) and uses an index on its time column.
 */
@Injectable()
export class WorkspaceEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  activityEvents(workspaceId: string, window: SourceWindow): Promise<ActivityEventRecord[]> {
    return this.prisma.activityEvent.findMany({
      where: { workspaceId, ...windowWhere('createdAt', window) },
      include: ACTIVITY_EVENT_INCLUDE,
      orderBy: sortWithTiebreak('createdAt', window.direction),
      take: window.limit,
    });
  }

  orders(workspaceId: string, window: SourceWindow): Promise<OrderEventRecord[]> {
    return this.prisma.order.findMany({
      where: { workspaceId, ...windowWhere('createdAt', window) },
      select: ORDER_EVENT_SELECT,
      orderBy: sortWithTiebreak('createdAt', window.direction),
      take: window.limit,
    });
  }

  /** Deliveries that gave up, at the time they settled. */
  failedDeliveries(workspaceId: string, window: SourceWindow): Promise<FailedDeliveryRecord[]> {
    return this.prisma.webhookDelivery.findMany({
      where: {
        workspaceId,
        status: WebhookDeliveryStatus.FAILED,
        ...windowWhere('updatedAt', window),
      },
      select: FAILED_DELIVERY_SELECT,
      orderBy: sortWithTiebreak('updatedAt', window.direction),
      take: window.limit,
    });
  }

  /**
   * The reader's conversations that may hold steps since `since`: those running now (their steps
   * are written as they happen) and those touched since then (a turn's end touches it).
   */
  async activeConversationIds(workspaceId: string, userId: string, since: Date): Promise<string[]> {
    const conversations = await this.prisma.agentWorkerConversation.findMany({
      where: {
        workspaceId,
        userId,
        OR: [{ runningTurnId: { not: null } }, { updatedAt: { gte: since } }],
      },
      select: { id: true },
    });
    return conversations.map(({ id }) => id);
  }

  /** Tool calls with a step (made, decided, finished) in the range, at most `limit`. */
  agentActions({
    conversationIds,
    since,
    until,
    limit,
    direction,
  }: AgentStepQuery): Promise<AgentWorkerAction[]> {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.prisma.agentWorkerAction.findMany({
      where: { conversationId: { in: conversationIds }, OR: anyStepIn(since, until) },
      orderBy: sortWithTiebreak('createdAt', direction),
      take: limit,
    });
  }

  /**
   * Proposals with a step (received, decided, finished) in the range, or pending ones whose
   * expiry fell in it (they read as expired before the worker marks them).
   */
  agentProposals(query: ProposalStepQuery): Promise<AgentProposalRecord[]> {
    const range = { gte: query.since, lte: query.until };
    return this.prisma.agentProposal.findMany({
      where: {
        workspaceId: query.workspaceId,
        OR: [
          { createdAt: range },
          { decidedAt: range },
          { finishedAt: range },
          { status: AgentProposalStatus.Pending, expiresAt: range },
        ],
      },
      include: AGENT_PROPOSAL_INCLUDE,
      orderBy: sortWithTiebreak('createdAt', query.direction),
      take: query.limit,
    });
  }

  /** Turns that failed in the range. */
  failedTurns(conversationIds: string[], since: Date, until: Date): Promise<AgentWorkerTurn[]> {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.prisma.agentWorkerTurn.findMany({
      where: {
        conversationId: { in: conversationIds },
        status: AgentWorkerTurnStatus.Failed,
        finishedAt: { gte: since, lte: until },
      },
    });
  }
}
