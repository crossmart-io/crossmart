import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { WorkspaceMemberProfile } from '../entities/workspace-access.js';
import type { ResolvedRole, RoleAssignment } from '../entities/role-assignment.js';
import type { MembershipManager } from '../entities/workspace-invitation.js';
import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import { permissionsCover } from '../permissions/role-permissions.js';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { roleName } from '../rules/role-name.js';
import { ApiKeyCleanup } from './api-key-cleanup.js';
import { RoleResolver } from './role-resolver.js';

export interface RoleChange extends RoleAssignment {
  userId: string;
}

interface MembershipChange {
  action: ActivityAction;
  member: WorkspaceMemberProfile;
  newRole?: ResolvedRole;
}

/**
 * Changes who is in a workspace and with which role. A manager only acts on members and roles
 * their own permissions cover, and a workspace always keeps an owner. A member's API keys never
 * outlive their access.
 */
@Injectable()
export class MembershipService {
  constructor(
    private readonly members: WorkspaceMemberRepository,
    private readonly roles: RoleResolver,
    private readonly keys: ApiKeyCleanup,
    private readonly activity: ActivityRecorder,
  ) {}

  async changeRole(
    workspaceId: string,
    manager: MembershipManager,
    change: RoleChange,
    actor: Actor,
  ): Promise<WorkspaceMemberProfile> {
    const member = await this.requireMember(workspaceId, change.userId);
    const target = await this.roles.resolve(workspaceId, change);
    this.assertManages(manager, member.permissions, target.permissions);
    if (member.role === target.role && member.customRole?.id === target.customRole?.id) {
      return member;
    }
    await this.assertKeepsAnOwner(workspaceId, member, target.role);
    await this.members.updateRole(workspaceId, member.userId, {
      role: target.role,
      customRoleId: target.customRole?.id ?? null,
    });
    await this.keys.revokeBeyond(workspaceId, member.userId, target.permissions);
    await this.record(workspaceId, actor, {
      action: ActivityAction.MemberRoleChanged,
      member,
      newRole: target,
    });
    return { ...member, ...target };
  }

  async remove(
    workspaceId: string,
    manager: MembershipManager,
    userId: string,
    actor: Actor,
  ): Promise<void> {
    const member = await this.requireMember(workspaceId, userId);
    this.assertManages(manager, member.permissions);
    await this.removeMember(workspaceId, member);
    await this.record(workspaceId, actor, { action: ActivityAction.MemberRemoved, member });
  }

  /** Refused for the user's only workspace: the app always needs one to open. */
  async leave(workspaceId: string, userId: string, actor: Actor): Promise<void> {
    const member = await this.requireMember(workspaceId, userId);
    if ((await this.members.countMemberships(userId)) <= 1) {
      throw new ConflictException('You cannot leave your only workspace');
    }
    await this.removeMember(workspaceId, member);
    await this.record(workspaceId, actor, { action: ActivityAction.MemberLeft, member });
  }

  private async removeMember(workspaceId: string, member: WorkspaceMemberProfile): Promise<void> {
    await this.assertKeepsAnOwner(workspaceId, member, null);
    await this.members.remove(workspaceId, member.userId);
    await this.keys.revokeBeyond(workspaceId, member.userId, null);
  }

  private async requireMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberProfile> {
    const member = await this.members.findMember(workspaceId, userId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  private assertManages(
    manager: MembershipManager,
    ...permissionSets: ReadonlySet<WorkspacePermission>[]
  ): void {
    if (
      !permissionSets.every((permissions) => permissionsCover(manager.permissions, permissions))
    ) {
      throw new ForbiddenException('You cannot change a member with more access than you have');
    }
  }

  /** `nextRole` is null when the member leaves. */
  private async assertKeepsAnOwner(
    workspaceId: string,
    member: WorkspaceMemberProfile,
    nextRole: WorkspaceRole | null,
  ): Promise<void> {
    if (member.role !== WorkspaceRole.OWNER || nextRole === WorkspaceRole.OWNER) return;
    if ((await this.members.countOwners(workspaceId)) <= 1) {
      throw new ConflictException('A workspace needs an owner. Make someone else an owner first.');
    }
  }

  private record(workspaceId: string, actor: Actor, change: MembershipChange): Promise<void> {
    const { action, member, newRole } = change;
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.Member, id: member.userId, label: member.email },
      ...(newRole ? { detail: `now ${roleName(newRole)}` } : {}),
    });
  }
}
