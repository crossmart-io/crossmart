import { Injectable } from '@nestjs/common';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';
import { workspaceDisplayName } from '../rules/workspace-display-name.js';

const ORGANIZATION_NAME = { organization: { select: { name: true } } } as const;

const MEMBER_PROFILE = {
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

interface MemberProfileRow {
  role: WorkspaceRole;
  createdAt: Date;
  user: { id: string; name: string; email: string };
}

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    return membership?.role ?? null;
  }

  async userHasAnyMembership(userId: string): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({ where: { userId } });
    return count > 0;
  }

  async listWorkspacesForUser(userId: string): Promise<WorkspaceAccess[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { role: true, workspace: { include: ORGANIZATION_NAME } },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ role, workspace }) => ({
      id: workspace.id,
      organizationId: workspace.organizationId,
      name: workspace.name,
      displayName: workspaceDisplayName(workspace.name, workspace.organization.name),
      slug: workspace.slug,
      currency: workspace.currency,
      role,
    }));
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: MEMBER_PROFILE,
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => this.toProfile(membership));
  }

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberProfile | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: MEMBER_PROFILE,
    });
    return membership ? this.toProfile(membership) : null;
  }

  isMemberByEmail(workspaceId: string, email: string): Promise<boolean> {
    return this.prisma.workspaceMember
      .count({ where: { workspaceId, user: { email: { equals: email, mode: 'insensitive' } } } })
      .then((count) => count > 0);
  }

  countOwners(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId, role: WorkspaceRole.OWNER },
    });
  }

  async updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> {
    await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  async remove(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  private toProfile({ role, createdAt, user }: MemberProfileRow): WorkspaceMemberProfile {
    return { userId: user.id, name: user.name, email: user.email, role, joinedAt: createdAt };
  }
}
