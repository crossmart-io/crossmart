import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus, PrismaService, WorkspaceRole } from '@crossmart/database';

/** A workspace the user belongs to, and whether deleting the user would leave others in it. */
export interface UserWorkspace {
  id: string;
  name: string;
  owner: boolean;
  otherMembers: number;
}

/** The deletes behind closing a workspace or an account. Rows cascade from these deletes. */
@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWorkspace(workspaceId: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    });
  }

  async connectedIds(workspaceId: string): Promise<string[]> {
    const rows = await this.prisma.channelConnection.findMany({
      where: { workspaceId, status: { not: ChannelConnectionStatus.DISCONNECTED } },
      select: { id: true },
    });
    return rows.map(({ id }) => id);
  }

  /**
   * Deletes the workspace and everything in it (products, stock, listings, orders, activity,
   * keys, members), then its organization once it has no workspaces left.
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { organizationId } = await tx.workspace.delete({
        where: { id: workspaceId },
        select: { organizationId: true },
      });
      const left = await tx.workspace.count({ where: { organizationId } });
      if (left === 0) await tx.organization.delete({ where: { id: organizationId } });
    });
  }

  async workspacesOf(userId: string): Promise<UserWorkspace[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        role: true,
        workspace: { select: { id: true, name: true, _count: { select: { members: true } } } },
      },
    });
    return memberships.map(({ role, workspace }) => ({
      id: workspace.id,
      name: workspace.name,
      owner: role === WorkspaceRole.OWNER,
      otherMembers: workspace._count.members - 1,
    }));
  }

  findUser(userId: string): Promise<{ id: string; name: string; email: string } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }

  /** Deletes the user with their sessions, logins and memberships; their activity stays, unnamed. */
  async deleteUser(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
