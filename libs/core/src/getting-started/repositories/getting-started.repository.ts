import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus, ListingStatus, PrismaService } from '@crossmart/database';
import { AgentProposalRepository } from '../../agent-proposals/repositories/agent-proposal.repository.js';
import { toOutsideAgentChanges } from '../../workspace-settings/workspace-settings.repository.js';
import { OutsideAgentChanges } from '../../workspace-settings/enums/outside-agent-changes.enum.js';
import type { AccountProgress } from '../entities/getting-started.js';

/** The workspace's own row as the steps read it. */
interface WorkspaceProgressRecord {
  outsideAgentChanges: string;
  sandboxAccount: { claimedAt: Date | null } | null;
  _count: { products: number; connections: number };
}

/**
 * What a new account has done so far, in a fixed number of counting queries on the
 * `workspace_id` indexes, so it stays cheap for a large workspace.
 */
@Injectable()
export class GettingStartedRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proposals: AgentProposalRepository,
  ) {}

  async progress(workspaceId: string, userId: string, now: Date): Promise<AccountProgress> {
    const [workspace, user, liveListings, pendingProposals] = await Promise.all([
      this.workspace(workspaceId),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { emailVerified: true },
      }),
      this.prisma.listing.count({ where: { workspaceId, status: ListingStatus.ACTIVE } }),
      this.proposals.countPending(workspaceId, now),
    ]);
    return {
      emailVerified: user.emailVerified,
      unclaimedSandbox: workspace.sandboxAccount !== null && !workspace.sandboxAccount.claimedAt,
      products: workspace._count.products,
      connectedStores: workspace._count.connections,
      liveListings,
      pendingProposals,
      agentChangesNeedApproval:
        toOutsideAgentChanges(workspace.outsideAgentChanges) ===
        OutsideAgentChanges.RequireApproval,
    };
  }

  private workspace(workspaceId: string): Promise<WorkspaceProgressRecord> {
    return this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: {
        outsideAgentChanges: true,
        sandboxAccount: { select: { claimedAt: true } },
        _count: {
          select: {
            products: true,
            connections: { where: { status: { not: ChannelConnectionStatus.DISCONNECTED } } },
          },
        },
      },
    });
  }
}
