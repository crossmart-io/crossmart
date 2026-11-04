import { Injectable, NotFoundException } from '@nestjs/common';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';
import type { ResolvedRole } from '../entities/role-assignment.js';
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

  /** The workspace as seen by a caller whose role has already been resolved. */
  async getWorkspace(workspaceId: string, access: ResolvedRole): Promise<WorkspaceAccess> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const { id, organizationId, name, slug, currency } = workspace;
    const displayName = workspaceDisplayName(name, workspace.organization.name);
    return { id, organizationId, name, displayName, slug, currency, ...access };
  }

  listWorkspacesForUser(userId: string): Promise<WorkspaceAccess[]> {
    return this.members.listWorkspacesForUser(userId);
  }

  listMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    return this.members.listMembers(workspaceId);
  }
}
