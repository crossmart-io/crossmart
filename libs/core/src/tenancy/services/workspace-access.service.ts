import { Injectable, NotFoundException } from '@nestjs/common';
import type { WorkspaceRole } from '@crossmart/database';
import type { WorkspaceAccess, WorkspaceMemberProfile } from '../entities/workspace-access.js';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { WorkspaceRepository } from '../repositories/workspace.repository.js';

/** Answers who belongs to which workspace, and with which role. */
@Injectable()
export class WorkspaceAccessService {
  constructor(
    private readonly members: WorkspaceMemberRepository,
    private readonly workspaces: WorkspaceRepository,
  ) {}

  /** The user's role in the workspace, or null when they are not a member. */
  findRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    return this.members.findRole(workspaceId, userId);
  }

  /** The workspace as seen by a caller whose role has already been resolved. */
  async getWorkspace(workspaceId: string, role: WorkspaceRole): Promise<WorkspaceAccess> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const { id, organizationId, name, slug } = workspace;
    return { id, organizationId, name, slug, role };
  }

  listWorkspacesForUser(userId: string): Promise<WorkspaceAccess[]> {
    return this.members.listWorkspacesForUser(userId);
  }

  listMembers(workspaceId: string): Promise<WorkspaceMemberProfile[]> {
    return this.members.listMembers(workspaceId);
  }
}
