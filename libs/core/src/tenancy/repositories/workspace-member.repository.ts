import { Injectable } from '@nestjs/common';
import { PrismaService, type WorkspaceRole } from '@crossmart/database';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';

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
      select: { role: true, workspace: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ role, workspace }) => ({
      id: workspace.id,
      organizationId: workspace.organizationId,
      name: workspace.name,
      slug: workspace.slug,
      currency: workspace.currency,
      role,
    }));
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ role, createdAt, user }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      joinedAt: createdAt,
    }));
  }
}
