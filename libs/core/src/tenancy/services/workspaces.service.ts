import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { NewWorkspace } from '../repositories/workspace.repository.js';
import type { WorkspaceInput } from '../entities/new-workspace.js';
import type { WorkspaceAccess } from '../entities/workspace-access.js';
import type { ResolvedRole } from '../entities/role-assignment.js';
import { resolveRole } from '../permissions/role-permissions.js';
import {
  WorkspaceRepository,
  type WorkspaceWithOrganization,
} from '../repositories/workspace.repository.js';
import { uniqueSlug } from '../rules/unique-slug.js';
import { workspaceDisplayName } from '../rules/workspace-display-name.js';
import {
  DEFAULT_WORKSPACE_CURRENCY,
  MAX_WORKSPACES_PER_ORGANIZATION,
} from '../tenancy.constants.js';

/**
 * More workspaces for one organization, such as one per client or per brand. Owners of a
 * workspace in the organization create them and own the new one.
 */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async create(
    organizationId: string,
    ownerId: string,
    input: WorkspaceInput,
  ): Promise<WorkspaceAccess> {
    await this.assertCanCreate(organizationId, ownerId);
    const name = input.name.trim();
    const taken = await this.workspaces.slugsLike(organizationId, uniqueSlug(name, []));
    const record: NewWorkspace = {
      organizationId,
      name,
      slug: uniqueSlug(name, taken),
      currency: (input.currency ?? DEFAULT_WORKSPACE_CURRENCY).toUpperCase(),
      ownerId,
    };
    const workspace = await this.workspaces.create(record);
    await this.record(workspace, Actor.user(ownerId), ActivityAction.WorkspaceCreated);
    return toAccess(workspace, resolveRole(WorkspaceRole.OWNER, null));
  }

  async rename(
    workspaceId: string,
    name: string,
    access: ResolvedRole,
    actor: Actor,
  ): Promise<WorkspaceAccess> {
    const before = await this.workspaces.findById(workspaceId);
    const workspace = await this.workspaces.rename(workspaceId, name.trim());
    if (before && before.name !== workspace.name) {
      await this.record(workspace, actor, ActivityAction.WorkspaceRenamed, before.name);
    }
    return toAccess(workspace, access);
  }

  private async assertCanCreate(organizationId: string, userId: string): Promise<void> {
    if (!(await this.workspaces.isOrganizationOwner(organizationId, userId))) {
      throw new ForbiddenException('Only owners of a workspace here can create workspaces');
    }
    const count = await this.workspaces.countInOrganization(organizationId);
    if (count >= MAX_WORKSPACES_PER_ORGANIZATION) {
      throw new ConflictException(
        `An organization can have ${MAX_WORKSPACES_PER_ORGANIZATION} workspaces`,
      );
    }
  }

  private record(
    workspace: WorkspaceWithOrganization,
    actor: Actor,
    action: ActivityAction,
    detail?: string,
  ): Promise<void> {
    return this.activity.record(workspace.id, actor, {
      action,
      subject: { type: ActivitySubjectType.Workspace, id: workspace.id, label: workspace.name },
      ...(detail ? { detail } : {}),
    });
  }
}

function toAccess(workspace: WorkspaceWithOrganization, access: ResolvedRole): WorkspaceAccess {
  const { id, organizationId, name, slug, currency } = workspace;
  const displayName = workspaceDisplayName(name, workspace.organization.name);
  return { id, organizationId, name, displayName, slug, currency, ...access };
}
