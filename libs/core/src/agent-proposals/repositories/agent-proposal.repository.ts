import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import { SortDirection, sortWithTiebreak } from '@crossmart/common';
import type { AgentProposerRef } from '../entities/agent-proposer.js';
import type { AgentProposalListQuery } from '../entities/agent-proposal-views.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import {
  AGENT_PROPOSAL_INCLUDE,
  type AgentProposalOutcomeRecord,
  type AgentProposalRecord,
  type NewAgentProposal,
} from './agent-proposal.queries.js';

/**
 * A status as people read it: a pending proposal past its expiry already counts as expired,
 * before the worker marks it.
 */
function statusWhere(status: AgentProposalStatus, now: Date): Prisma.AgentProposalWhereInput {
  if (status === AgentProposalStatus.Pending) return { status, expiresAt: { gt: now } };
  if (status !== AgentProposalStatus.Expired) return { status };
  return {
    OR: [{ status }, { status: AgentProposalStatus.Pending, expiresAt: { lte: now } }],
  };
}

/** Outside agents' proposals. Every query names the workspace. */
@Injectable()
export class AgentProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewAgentProposal): Promise<AgentProposalRecord> {
    return this.prisma.agentProposal.create({ data, include: AGENT_PROPOSAL_INCLUDE });
  }

  find(workspaceId: string, id: string): Promise<AgentProposalRecord | null> {
    return this.prisma.agentProposal.findFirst({
      where: { id, workspaceId },
      include: AGENT_PROPOSAL_INCLUDE,
    });
  }

  /** A proposal only its own proposer may read: the same OAuth client and person, or key. */
  findForProposer(proposer: AgentProposerRef, id: string): Promise<AgentProposalRecord | null> {
    return this.prisma.agentProposal.findFirst({
      where: {
        id,
        workspaceId: proposer.workspaceId,
        proposerKind: proposer.kind,
        userId: proposer.userId,
        oauthClientId: proposer.oauthClientId,
        apiKeyId: proposer.apiKeyId,
      },
      include: AGENT_PROPOSAL_INCLUDE,
    });
  }

  async list(
    workspaceId: string,
    query: AgentProposalListQuery,
    now: Date,
  ): Promise<{ records: AgentProposalRecord[]; total: number }> {
    const where: Prisma.AgentProposalWhereInput = {
      workspaceId,
      ...(query.status ? statusWhere(query.status, now) : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.agentProposal.findMany({
        where,
        include: AGENT_PROPOSAL_INCLUDE,
        orderBy: sortWithTiebreak('createdAt', SortDirection.Desc),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.agentProposal.count({ where }),
    ]);
    return { records, total };
  }

  /**
   * Moves a pending, unexpired proposal to `status` for the person deciding, in one conditional
   * update, so two decisions never both win. Returns whether this one did.
   */
  async decide(
    workspaceId: string,
    id: string,
    status: AgentProposalStatus,
    decision: { userId: string; now: Date },
  ): Promise<boolean> {
    const { count } = await this.prisma.agentProposal.updateMany({
      where: {
        id,
        workspaceId,
        status: AgentProposalStatus.Pending,
        expiresAt: { gt: decision.now },
      },
      data: { status, decidedByUserId: decision.userId, decidedAt: decision.now },
    });
    return count === 1;
  }

  /** Records how an approved proposal ended. */
  async finish(id: string, outcome: AgentProposalOutcomeRecord): Promise<void> {
    await this.prisma.agentProposal.update({
      where: { id },
      data: { ...outcome, finishedAt: new Date() },
    });
  }

  /** A proposal being applied now: the only state its internal credential works in. */
  findApplying(workspaceId: string, id: string): Promise<AgentProposalRecord | null> {
    return this.prisma.agentProposal.findFirst({
      where: { id, workspaceId, status: AgentProposalStatus.Applying },
      include: AGENT_PROPOSAL_INCLUDE,
    });
  }

  /** How many wait for a decision now. */
  countPending(workspaceId: string, now: Date): Promise<number> {
    return this.prisma.agentProposal.count({
      where: { workspaceId, ...statusWhere(AgentProposalStatus.Pending, now) },
    });
  }

  /** Marks up to `limit` pending proposals past their expiry as expired; returns how many. */
  async expireBatch(now: Date, limit: number): Promise<number> {
    const due = await this.prisma.agentProposal.findMany({
      where: { status: AgentProposalStatus.Pending, expiresAt: { lte: now } },
      select: { id: true },
      orderBy: { expiresAt: SortDirection.Asc },
      take: limit,
    });
    if (due.length === 0) return 0;
    const { count } = await this.prisma.agentProposal.updateMany({
      where: { id: { in: due.map(({ id }) => id) }, status: AgentProposalStatus.Pending },
      data: { status: AgentProposalStatus.Expired, decidedAt: now },
    });
    return count;
  }

  /** An API key's name, which stands for the agent of an MCP session that uses it. */
  async apiKeyName(workspaceId: string, apiKeyId: string): Promise<string | null> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: apiKeyId, workspaceId },
      select: { name: true },
    });
    return key?.name ?? null;
  }
}
