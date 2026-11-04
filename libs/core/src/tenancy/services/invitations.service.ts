import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateSecureToken, hashSecret } from '@crossmart/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type {
  AcceptedInvitation,
  InvitationPreview,
  InvitationSummary,
  Invitee,
  MembershipManager,
  NewInvitation,
} from '../entities/workspace-invitation.js';
import { permissionsCover, resolveRole } from '../permissions/role-permissions.js';
import {
  type PendingInvitation,
  WorkspaceInvitationRepository,
} from '../repositories/workspace-invitation.repository.js';
import { roleName } from '../rules/role-name.js';
import {
  INVITATION_TOKEN_BYTES,
  INVITATION_TTL_MS,
  MAX_PENDING_INVITATIONS,
} from '../tenancy.constants.js';
import { InvitationMailer } from './invitation-mailer.js';
import { RoleResolver } from './role-resolver.js';

const INVALID_INVITATION = 'This invitation is invalid, used or expired';

/**
 * Invites people to a workspace by email. The link carries a random token; only its hash is
 * stored. Accepting needs a signed-in account with the invited address.
 */
@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitations: WorkspaceInvitationRepository,
    private readonly roles: RoleResolver,
    private readonly mailer: InvitationMailer,
    private readonly activity: ActivityRecorder,
  ) {}

  /** A new invitation replaces a pending one to the same address. */
  async invite(
    workspaceId: string,
    manager: MembershipManager,
    request: NewInvitation,
    actor: Actor,
  ): Promise<InvitationSummary> {
    const granted = await this.roles.resolve(workspaceId, request);
    if (!permissionsCover(manager.permissions, granted.permissions)) {
      throw new ForbiddenException('You cannot invite someone with more access than you have');
    }
    const email = normalizeEmail(request.email);
    const now = new Date();
    await this.assertInvitable(workspaceId, email, now);
    const token = generateSecureToken(INVITATION_TOKEN_BYTES);
    const invitation = await this.invitations.replacePending(
      {
        workspaceId,
        email,
        role: granted.role,
        customRoleId: granted.customRole?.id ?? null,
        tokenHash: hashSecret(token),
        invitedById: manager.userId,
        expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
      },
      now,
    );
    this.mailer.send(invitation, token);
    await this.record(workspaceId, actor, ActivityAction.MemberInvited, invitation);
    const { workspaceName: _workspaceName, ...summary } = invitation;
    return summary;
  }

  listPending(workspaceId: string): Promise<InvitationSummary[]> {
    return this.invitations.listPending(workspaceId, new Date());
  }

  async revoke(workspaceId: string, invitationId: string, actor: Actor): Promise<void> {
    const email = await this.invitations.revoke(workspaceId, invitationId, new Date());
    if (!email) {
      throw new NotFoundException('Invitation not found');
    }
    await this.record(workspaceId, actor, ActivityAction.InvitationRevoked, {
      id: invitationId,
      email,
    });
  }

  async preview(token: string): Promise<InvitationPreview> {
    const invitation = await this.findPending(token);
    const { workspaceName, inviterName, email, role, expiresAt } = invitation;
    const roleName = this.roleNameOf(invitation);
    return { workspaceName, inviterName, email, role, roleName, expiresAt };
  }

  async accept(token: string, invitee: Invitee, actor: Actor): Promise<AcceptedInvitation> {
    const invitation = await this.findPending(token);
    if (normalizeEmail(invitee.email) !== invitation.email) {
      throw new ForbiddenException(
        `This invitation is for ${invitation.email}. Sign in with that address to accept it.`,
      );
    }
    if (!(await this.invitations.accept(invitation, invitee.userId, new Date()))) {
      throw new NotFoundException(INVALID_INVITATION);
    }
    await this.activity.record(invitation.workspaceId, actor, {
      action: ActivityAction.MemberJoined,
      subject: { type: ActivitySubjectType.Member, id: invitee.userId, label: invitation.email },
      detail: `as ${this.roleNameOf(invitation)}`,
    });
    return { workspaceId: invitation.workspaceId, role: invitation.role };
  }

  private async assertInvitable(workspaceId: string, email: string, now: Date): Promise<void> {
    if (await this.invitations.hasMember(workspaceId, email)) {
      throw new ConflictException(`${email} is already a member of this workspace`);
    }
    if ((await this.invitations.countPending(workspaceId, now)) >= MAX_PENDING_INVITATIONS) {
      throw new ConflictException(
        `A workspace can have ${MAX_PENDING_INVITATIONS} pending invitations. Revoke some first.`,
      );
    }
  }

  /** A pending invitation whose role still exists; one whose custom role was deleted is void. */
  private async findPending(token: string): Promise<PendingInvitation> {
    const invitation = await this.invitations.findPendingByTokenHash(hashSecret(token), new Date());
    if (!invitation || resolveRole(invitation.role, invitation.customRole).permissions.size === 0) {
      throw new NotFoundException(INVALID_INVITATION);
    }
    return invitation;
  }

  private roleNameOf(invitation: PendingInvitation): string {
    return roleName(resolveRole(invitation.role, invitation.customRole));
  }

  /** The address is the label: it is what managers know the invitee by. */
  private record(
    workspaceId: string,
    actor: Actor,
    action: ActivityAction,
    invitation: Pick<InvitationSummary, 'id' | 'email'> &
      Partial<Pick<InvitationSummary, 'role' | 'customRole'>>,
  ): Promise<void> {
    const { id, email, role, customRole } = invitation;
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.Invitation, id, label: email },
      ...(role ? { detail: `as ${roleName({ role, customRole: customRole ?? null })}` } : {}),
    });
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
