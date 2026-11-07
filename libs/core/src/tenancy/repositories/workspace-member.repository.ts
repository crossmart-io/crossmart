import { Injectable } from '@nestjs/common';
import { PrismaService, WorkspaceRole } from '@crossmart/database';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';
import type { ResolvedRole, StoredCustomRole } from '../entities/role-assignment.js';
import { resolveRole } from '../permissions/role-permissions.js';
import { toWorkspaceAccess, WORKSPACE_ACCESS_INCLUDE } from '../rules/workspace-access.js';
import { CUSTOM_ROLE_SELECT } from './custom-role.repository.js';

const MEMBER_PROFILE = {
  role: true,
  createdAt: true,
  ...CUSTOM_ROLE_SELECT,
  user: { select: { id: true, name: true, email: true } },
} as const;

interface MemberProfileRow {
  role: WorkspaceRole;
  createdAt: Date;
  customRole: StoredCustomRole | null;
  user: { id: string; name: string; email: string };
}

export interface RoleUpdate {
  role: WorkspaceRole;
  customRoleId: string | null;
}

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's role and permissions here, or null when they are not a member. */
  async findRole(workspaceId: string, userId: string): Promise<ResolvedRole | null> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true, ...CUSTOM_ROLE_SELECT },
    });
    return membership ? resolveRole(membership.role, membership.customRole) : null;
  }

  /** The user's roles in every workspace of the organization they belong to. */
  async findRolesInOrganization(organizationId: string, userId: string): Promise<ResolvedRole[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, workspace: { organizationId } },
      select: { role: true, ...CUSTOM_ROLE_SELECT },
    });
    return memberships.map(({ role, customRole }) => resolveRole(role, customRole));
  }

  async userHasAnyMembership(userId: string): Promise<boolean> {
    return (await this.countMemberships(userId)) > 0;
  }

  countMemberships(userId: string): Promise<number> {
    return this.prisma.workspaceMember.count({ where: { userId } });
  }

  async listWorkspacesForUser(userId: string): Promise<WorkspaceAccess[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        role: true,
        ...CUSTOM_ROLE_SELECT,
        workspace: { include: WORKSPACE_ACCESS_INCLUDE },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ role, customRole, workspace }) =>
      toWorkspaceAccess(workspace, resolveRole(role, customRole)),
    );
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

  countOwners(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId, role: WorkspaceRole.OWNER },
    });
  }

  async updateRole(workspaceId: string, userId: string, update: RoleUpdate): Promise<void> {
    await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: update,
    });
  }

  async remove(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  private toProfile({
    role,
    customRole,
    createdAt,
    user,
  }: MemberProfileRow): WorkspaceMemberProfile {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      joinedAt: createdAt,
      ...resolveRole(role, customRole),
    };
  }
}
