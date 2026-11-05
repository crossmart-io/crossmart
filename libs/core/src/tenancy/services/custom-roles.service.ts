import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type {
  CustomRoleInput,
  CustomRoleSummary,
  CustomRoleUsage,
} from '../entities/custom-role.js';
import type { StoredCustomRole } from '../entities/role-assignment.js';
import type { MembershipManager } from '../entities/workspace-invitation.js';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import {
  customRolePermissions,
  OWNER_ONLY_PERMISSIONS,
  permissionsCover,
  toPermissionList,
} from '../permissions/role-permissions.js';
import {
  type CustomRoleRecord,
  CustomRoleRepository,
  type CustomRoleWithCount,
} from '../repositories/custom-role.repository.js';
import { MAX_CUSTOM_ROLES } from '../tenancy.constants.js';
import { ApiKeyCleanup } from './api-key-cleanup.js';

export interface CustomRoleUpdate extends CustomRoleInput {
  id: string;
}

/**
 * Roles a workspace defines itself, as sets of permissions. Nobody defines or edits a role with
 * more access than they have, and a role in use cannot be deleted.
 */
@Injectable()
export class CustomRolesService {
  constructor(
    private readonly customRoles: CustomRoleRepository,
    private readonly keys: ApiKeyCleanup,
    private readonly activity: ActivityRecorder,
  ) {}

  async list(workspaceId: string): Promise<CustomRoleSummary[]> {
    const roles = await this.customRoles.list(workspaceId);
    return roles.map((role) => this.toSummary(role));
  }

  async create(
    workspaceId: string,
    manager: MembershipManager,
    input: CustomRoleInput,
    actor: Actor,
  ): Promise<CustomRoleSummary> {
    const permissions = this.grantable(manager, input.permissions);
    if ((await this.customRoles.list(workspaceId)).length >= MAX_CUSTOM_ROLES) {
      throw new ConflictException(`A workspace can have ${MAX_CUSTOM_ROLES} custom roles`);
    }
    await this.assertNameFree(workspaceId, input.name);
    const role = await this.customRoles.create(workspaceId, this.toRecord(input, permissions));
    await this.record(workspaceId, actor, ActivityAction.CustomRoleCreated, role);
    return this.toSummary(role);
  }

  /** Narrowing a role revokes its members' API keys that now allow more than the role. */
  async update(
    workspaceId: string,
    manager: MembershipManager,
    update: CustomRoleUpdate,
    actor: Actor,
  ): Promise<CustomRoleSummary> {
    const existing = await this.requireRole(workspaceId, update.id);
    this.grantable(manager, toPermissionList(customRolePermissions(existing.permissions)));
    const permissions = this.grantable(manager, update.permissions);
    await this.assertNameFree(workspaceId, update.name, update.id);
    const role = await this.customRoles.update(
      workspaceId,
      update.id,
      this.toRecord(update, permissions),
    );
    await this.revokeKeysBeyond(workspaceId, update.id, new Set(permissions));
    await this.record(workspaceId, actor, ActivityAction.CustomRoleUpdated, role);
    return this.toSummary(role);
  }

  async delete(workspaceId: string, customRoleId: string, actor: Actor): Promise<void> {
    const role = await this.requireRole(workspaceId, customRoleId);
    const usage = await this.customRoles.usage(customRoleId, new Date());
    if (usage.members + usage.pendingInvitations + usage.activeApiKeys > 0) {
      throw new ConflictException(describeUsage(role.name, usage));
    }
    await this.customRoles.delete(workspaceId, customRoleId);
    await this.record(workspaceId, actor, ActivityAction.CustomRoleDeleted, role);
  }

  /**
   * The permissions a role will hold: always able to open the workspace, never owner-only, in
   * the enum's order, and never more than the manager has.
   */
  private grantable(
    manager: MembershipManager,
    requested: readonly WorkspacePermission[],
  ): WorkspacePermission[] {
    const ownerOnly = requested.filter((permission) => OWNER_ONLY_PERMISSIONS.includes(permission));
    if (ownerOnly.length > 0) {
      throw new BadRequestException(`Only owners can have ${ownerOnly.join(', ')}`);
    }
    const permissions = new Set([WorkspacePermission.ViewWorkspace, ...requested]);
    if (!permissionsCover(manager.permissions, permissions)) {
      throw new ForbiddenException('A role cannot have more access than you have');
    }
    return toPermissionList(permissions);
  }

  private async revokeKeysBeyond(
    workspaceId: string,
    customRoleId: string,
    permissions: ReadonlySet<WorkspacePermission>,
  ): Promise<void> {
    for (const userId of await this.customRoles.memberUserIds(customRoleId)) {
      await this.keys.revokeBeyond(workspaceId, userId, permissions);
    }
  }

  private async requireRole(workspaceId: string, customRoleId: string): Promise<StoredCustomRole> {
    const role = await this.customRoles.find(workspaceId, customRoleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  private async assertNameFree(
    workspaceId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    if (await this.customRoles.nameTaken(workspaceId, name.trim(), exceptId)) {
      throw new ConflictException(`A role named ${name.trim()} already exists`);
    }
  }

  private toRecord(input: CustomRoleInput, permissions: WorkspacePermission[]): CustomRoleRecord {
    return {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      permissions,
    };
  }

  private record(
    workspaceId: string,
    actor: Actor,
    action: ActivityAction,
    role: { id: string; name: string },
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.CustomRole, id: role.id, label: role.name },
    });
  }

  private toSummary(role: CustomRoleWithCount): CustomRoleSummary {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: toPermissionList(customRolePermissions(role.permissions)),
      memberCount: role._count.members,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

function describeUsage(name: string, usage: CustomRoleUsage): string {
  const uses = [
    usage.members > 0 ? `${usage.members} member(s)` : null,
    usage.pendingInvitations > 0 ? `${usage.pendingInvitations} pending invitation(s)` : null,
    usage.activeApiKeys > 0 ? `${usage.activeApiKeys} API key(s)` : null,
  ].filter((use) => use !== null);
  return `${name} is still used by ${uses.join(', ')}. Give them another role first.`;
}
