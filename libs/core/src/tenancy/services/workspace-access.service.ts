import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';
import type { ResolvedRole } from '../entities/role-assignment.js';
import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { WorkspaceRepository } from '../repositories/workspace.repository.js';
import { workspaceDisplayName } from '../rules/workspace-display-name.js';

/** Answers who belongs to which workspace, with which role and permissions. */
@Injectable()
export class WorkspaceAccessService {
  constructor(
    private readonly members: WorkspaceMemberRepository,
    private readonly workspaces: WorkspaceRepository,
  ) {}

  /** The user's role and permissions in the workspace, or null when they are not a member. */
  findRole(workspaceId: string, userId: string): Promise<ResolvedRole | null> {
    return this.members.findRole(workspaceId, userId);
  }

  /**
   * For organization routes: the user must hold `permission` in at least one workspace of the
   * organization. Outsiders get 404, so organization ids do not leak.
   */
  async assertOrganizationPermission(
    organizationId: string,
    userId: string,
    permission: WorkspacePermission,
  ): Promise<void> {
    const roles = await this.members.findRolesInOrganization(organizationId, userId);
    if (roles.length === 0) {
      throw new NotFoundException('Organization not found');
    }
    if (!roles.some((role) => role.permissions.has(permission))) {
      throw new ForbiddenException(`Requires the ${permission} permission`);
    }
  }

  /** The workspace as seen by a caller whose role has already been resolved. */
  async getWorkspace(workspaceId: string, access: ResolvedRole): Promise<WorkspaceAccess> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const { id, organizationId, name, slug, currency, timeZone } = workspace;
    const displayName = workspaceDisplayName(name, workspace.organization.name);
    return { id, organizationId, name, displayName, slug, currency, timeZone, ...access };
  }

  listWorkspacesForUser(userId: string): Promise<WorkspaceAccess[]> {
    return this.members.listWorkspacesForUser(userId);
  }

  listMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    return this.members.listMembers(workspaceId);
  }
}
