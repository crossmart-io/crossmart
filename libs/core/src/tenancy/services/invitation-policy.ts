import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { SandboxRestriction } from '../../entitlements/enums/sandbox-restriction.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import type { ResolvedRole } from '../entities/role-assignment.js';
import type { MembershipManager, NewInvitation } from '../entities/workspace-invitation.js';
import { permissionsCover } from '../permissions/role-permissions.js';
import { WorkspaceInvitationRepository } from '../repositories/workspace-invitation.repository.js';
import { MAX_PENDING_INVITATIONS } from '../tenancy.constants.js';
import { RoleResolver } from './role-resolver.js';

/** Addresses are compared lowercased, so an invitation matches however the invitee types it. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Who may be invited, with which role: the workspace must not be an unclaimed sandbox, the
 * manager must hold every permission the role grants, the address must not be a member yet, the
 * workspace must have room for another pending invitation, and a newcomer to the organization
 * needs a seat in the plan (`Feature.Members`).
 */
@Injectable()
export class InvitationPolicy {
  constructor(
    private readonly invitations: WorkspaceInvitationRepository,
    private readonly roles: RoleResolver,
    private readonly entitlements: EntitlementService,
  ) {}

  /** The role the invitation grants, once every rule allows it. `request.email` is normalized. */
  async admit(
    workspaceId: string,
    manager: MembershipManager,
    request: NewInvitation,
    now: Date,
  ): Promise<ResolvedRole> {
    await this.entitlements.assertSandboxAllows(workspaceId, SandboxRestriction.InviteMember);
    const granted = await this.roles.resolve(workspaceId, request);
    if (!permissionsCover(manager.permissions, granted.permissions)) {
      throw new ForbiddenException('You cannot invite someone with more access than you have');
    }
    await this.assertInvitable(workspaceId, request.email, now);
    await this.assertSeat(workspaceId, request.email);
    return granted;
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

  /** People already in another workspace of the organization hold a seat already. */
  private async assertSeat(workspaceId: string, email: string): Promise<void> {
    if (await this.invitations.hasOrganizationMember(workspaceId, email)) return;
    await this.entitlements.assertInWorkspace(workspaceId, Feature.Members);
  }
}
