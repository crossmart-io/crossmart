import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelConnectionStatus, ListingStatus, PrismaService } from '@crossmart/database';

/** The workspaces of one organization, which usage is counted across. */
export interface OrganizationScope {
  organizationId: string;
  workspaceIds: string[];
}

/**
 * Counts what an organization uses, one aggregate query per feature over its workspaces.
 * Every count filters on `workspace_id`, which each counted table indexes.
 */
@Injectable()
export class UsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async organizationIdOf(workspaceId: string): Promise<string> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { organizationId: true },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace.organizationId;
  }

  async scopeOf(organizationId: string): Promise<OrganizationScope> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId },
      select: { id: true },
    });
    return { organizationId, workspaceIds: workspaces.map((workspace) => workspace.id) };
  }

  countActiveListings({ workspaceIds }: OrganizationScope): Promise<number> {
    return this.prisma.listing.count({
      where: { workspaceId: { in: workspaceIds }, status: ListingStatus.ACTIVE },
    });
  }

  /** Connections that hold a slot: every one the merchant has not disconnected. */
  countChannelConnections({ workspaceIds }: OrganizationScope): Promise<number> {
    return this.prisma.channelConnection.count({
      where: {
        workspaceId: { in: workspaceIds },
        status: { not: ChannelConnectionStatus.DISCONNECTED },
      },
    });
  }

  /** People in at least one of the workspaces, each counted once. */
  countMembers({ workspaceIds }: OrganizationScope): Promise<number> {
    return this.prisma.user.count({
      where: { memberships: { some: { workspaceId: { in: workspaceIds } } } },
    });
  }

  countActiveApiKeys({ workspaceIds }: OrganizationScope, now: Date): Promise<number> {
    return this.prisma.apiKey.count({
      where: {
        workspaceId: { in: workspaceIds },
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
  }
}
