import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { SubscriptionAccessPolicy } from '../../entitlements/services/subscription-access-policy.js';
import type { NewWorkspace } from '../repositories/workspace.repository.js';
import type { WorkspaceChanges, WorkspaceInput } from '../entities/new-workspace.js';
import type { WorkspaceAccess } from '../entities/workspace-access.js';
import type { ResolvedRole } from '../entities/role-assignment.js';
import { resolveRole } from '../permissions/role-permissions.js';
import {
  WorkspaceRepository,
  type WorkspaceWithOrganization,
} from '../repositories/workspace.repository.js';
import { uniqueSlug } from '../rules/unique-slug.js';
import { toWorkspaceAccess } from '../rules/workspace-access.js';
import {
  DEFAULT_WORKSPACE_CURRENCY,
  MAX_WORKSPACES_PER_ORGANIZATION,
  OUTSIDE_AGENT_CHANGES_DETAIL,
} from '../tenancy.constants.js';
import { toOutsideAgentChanges } from '../../workspace-settings/workspace-settings.repository.js';

/**
 * More workspaces for one organization, such as one per client or per brand. Owners of a
 * workspace in the organization create them and own the new one, within the plan's
 * `Feature.Workspaces` limit.
 */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly activity: ActivityRecorder,
    private readonly entitlements: EntitlementService,
    private readonly subscriptionAccess: SubscriptionAccessPolicy,
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
      timeZone: input.timeZone ?? null,
      ownerId,
    };
    const workspace = await this.workspaces.create(record);
    await this.record(workspace, Actor.user(ownerId), ActivityAction.WorkspaceCreated);
    return toWorkspaceAccess(workspace, resolveRole(WorkspaceRole.OWNER, null));
  }

  /**
   * Renames the workspace, sets its time zone or says whether outside agents' changes wait for
   * approval, recording each change.
   */
  async update(
    workspaceId: string,
    changes: WorkspaceChanges,
    access: ResolvedRole,
    actor: Actor,
  ): Promise<WorkspaceAccess> {
    const before = await this.workspaces.findById(workspaceId);
    const workspace = await this.workspaces.update(workspaceId, {
      ...(changes.name === undefined ? {} : { name: changes.name.trim() }),
      ...(changes.timeZone === undefined ? {} : { timeZone: changes.timeZone }),
      ...(changes.outsideAgentChanges === undefined
        ? {}
        : { outsideAgentChanges: changes.outsideAgentChanges }),
    });
    if (before) await this.recordChanges(before, workspace, actor);
    return toWorkspaceAccess(workspace, access);
  }

  private async recordChanges(
    before: WorkspaceWithOrganization,
    after: WorkspaceWithOrganization,
    actor: Actor,
  ): Promise<void> {
    if (before.name !== after.name) {
      await this.record(after, actor, ActivityAction.WorkspaceRenamed, before.name);
    }
    if (after.timeZone && before.timeZone !== after.timeZone) {
      await this.record(after, actor, ActivityAction.WorkspaceTimeZoneChanged, after.timeZone);
    }
    if (before.outsideAgentChanges !== after.outsideAgentChanges) {
      const detail = OUTSIDE_AGENT_CHANGES_DETAIL[toOutsideAgentChanges(after.outsideAgentChanges)];
      await this.record(after, actor, ActivityAction.OutsideAgentChangesChanged, detail);
    }
  }

  private async assertCanCreate(organizationId: string, userId: string): Promise<void> {
    await this.entitlements.assertSandboxAllowsInOrganization(
      organizationId,
      SandboxRestriction.CreateWorkspace,
    );
    if (!(await this.workspaces.isOrganizationOwner(organizationId, userId))) {
      throw new ForbiddenException('Only owners of a workspace here can create workspaces');
    }
    await this.subscriptionAccess.assertWritable(organizationId);
    const count = await this.workspaces.countInOrganization(organizationId);
    if (count >= MAX_WORKSPACES_PER_ORGANIZATION) {
      throw new ConflictException(
        `An organization can have ${MAX_WORKSPACES_PER_ORGANIZATION} workspaces`,
      );
    }
    await this.entitlements.assert(organizationId, Feature.Workspaces);
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
