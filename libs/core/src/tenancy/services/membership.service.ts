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
import type { MembershipManager } from '../entities/workspace-invitation.js';
import { roleCovers } from '../permissions/role-permissions.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { WORKSPACE_ROLE_NAMES } from '../tenancy.constants.js';

export interface RoleChange {
  userId: string;
  role: WorkspaceRole;
}

interface MembershipChange {
  action: ActivityAction;
  member: WorkspaceMemberProfile;
  newRole?: WorkspaceRole;
}

/**
 * Changes who is in a workspace and with which role. A manager only acts on roles their own
 * covers, and a workspace always keeps an owner. A member's API keys never outlive their access.
 */
@Injectable()
export class MembershipService {
  constructor(
    private readonly members: WorkspaceMemberRepository,
    private readonly apiKeys: ApiKeyRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async changeRole(
    workspaceId: string,
    manager: MembershipManager,
    change: RoleChange,
    actor: Actor,
  ): Promise<WorkspaceMemberProfile> {
    const member = await this.requireMember(workspaceId, change.userId);
    this.assertManages(manager.role, member.role, change.role);
    if (member.role === change.role) return member;
    await this.assertKeepsAnOwner(workspaceId, member, change.role);
    await this.members.updateRole(workspaceId, member.userId, change.role);
    await this.apiKeys.revokeCreatedBy(
      workspaceId,
      member.userId,
      new Date(),
      rolesBeyond(change.role),
    );
    await this.record(workspaceId, actor, {
      action: ActivityAction.MemberRoleChanged,
      member,
      newRole: change.role,
    });
    return { ...member, role: change.role };
  }

  async remove(
    workspaceId: string,
    manager: MembershipManager,
    userId: string,
    actor: Actor,
  ): Promise<void> {
    const member = await this.requireMember(workspaceId, userId);
    this.assertManages(manager.role, member.role);
    await this.removeMember(workspaceId, member);
    await this.record(workspaceId, actor, { action: ActivityAction.MemberRemoved, member });
  }

  async leave(workspaceId: string, userId: string, actor: Actor): Promise<void> {
    const member = await this.requireMember(workspaceId, userId);
    await this.removeMember(workspaceId, member);
    await this.record(workspaceId, actor, { action: ActivityAction.MemberLeft, member });
  }

  private async removeMember(workspaceId: string, member: WorkspaceMemberProfile): Promise<void> {
    await this.assertKeepsAnOwner(workspaceId, member, null);
    await this.members.remove(workspaceId, member.userId);
    await this.apiKeys.revokeCreatedBy(workspaceId, member.userId, new Date());
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

  private assertManages(managerRole: WorkspaceRole, ...roles: WorkspaceRole[]): void {
    if (!roles.every((role) => roleCovers(managerRole, role))) {
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
      ...(newRole ? { detail: `now ${WORKSPACE_ROLE_NAMES[newRole]}` } : {}),
    });
  }
}

/** Roles a key may no longer hold once its creator has `role`. */
function rolesBeyond(role: WorkspaceRole): WorkspaceRole[] {
  return Object.values(WorkspaceRole).filter((other) => !roleCovers(role, other));
}
