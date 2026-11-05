import { Injectable } from '@nestjs/common';
import { PrismaService, type WorkspaceRole } from '@crossmart/database';
import type { StoredCustomRole } from '../entities/role-assignment.js';
import type { InvitationSummary } from '../entities/workspace-invitation.js';
import { resolveRole } from '../permissions/role-permissions.js';
import { workspaceDisplayName } from '../rules/workspace-display-name.js';
import { CUSTOM_ROLE_SELECT } from './custom-role.repository.js';

export interface InvitationRecord {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  customRoleId: string | null;
  tokenHash: string;
  invitedById: string;
  expiresAt: Date;
}

/** A new invitation, with what its email needs. */
export interface CreatedInvitation extends InvitationSummary {
  workspaceName: string;
}

/** A pending invitation found by its link, with what showing and accepting it needs. */
export interface PendingInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
  email: string;
  role: WorkspaceRole;
  customRole: StoredCustomRole | null;
  expiresAt: Date;
}

interface InvitationRow {
  id: string;
  email: string;
  role: WorkspaceRole;
  customRole: StoredCustomRole | null;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { name: string };
}

const INVITATION_DETAILS = {
  invitedBy: { select: { name: true } },
  ...CUSTOM_ROLE_SELECT,
} as const;
const WORKSPACE_NAMES = {
  workspace: { select: { name: true, organization: { select: { name: true } } } },
} as const;

function displayNameOf(workspace: { name: string; organization: { name: string } }): string {
  return workspaceDisplayName(workspace.name, workspace.organization.name);
}

@Injectable()
export class WorkspaceInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the invitation and revokes any earlier pending one to the same address. */
  async replacePending(record: InvitationRecord, now: Date): Promise<CreatedInvitation> {
    const [, invitation] = await this.prisma.$transaction([
      this.prisma.workspaceInvitation.updateMany({
        where: { ...this.pendingWhere(record.workspaceId, now), email: record.email },
        data: { revokedAt: now },
      }),
      this.prisma.workspaceInvitation.create({
        data: record,
        include: { ...INVITATION_DETAILS, ...WORKSPACE_NAMES },
      }),
    ]);
    return { ...this.toSummary(invitation), workspaceName: displayNameOf(invitation.workspace) };
  }

  countPending(workspaceId: string, now: Date): Promise<number> {
    return this.prisma.workspaceInvitation.count({ where: this.pendingWhere(workspaceId, now) });
  }

  async hasMember(workspaceId: string, email: string): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({
      where: { workspaceId, user: { email: { equals: email, mode: 'insensitive' } } },
    });
    return count > 0;
  }

  /** True when the address belongs to a member of any workspace of this one's organization. */
  async hasOrganizationMember(workspaceId: string, email: string): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({
      where: {
        user: { email: { equals: email, mode: 'insensitive' } },
        workspace: { organization: { workspaces: { some: { id: workspaceId } } } },
      },
    });
    return count > 0;
  }

  async listPending(workspaceId: string, now: Date): Promise<InvitationSummary[]> {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: this.pendingWhere(workspaceId, now),
      include: INVITATION_DETAILS,
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map((invitation) => this.toSummary(invitation));
  }

  /** Returns the revoked invitation's address, or null when it is not pending here. */
  async revoke(workspaceId: string, invitationId: string, now: Date): Promise<string | null> {
    const where = { ...this.pendingWhere(workspaceId, now), id: invitationId };
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where,
      select: { email: true },
    });
    if (!invitation) return null;
    const { count } = await this.prisma.workspaceInvitation.updateMany({
      where,
      data: { revokedAt: now },
    });
    return count > 0 ? invitation.email : null;
  }

  async findPendingByTokenHash(tokenHash: string, now: Date): Promise<PendingInvitation | null> {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { tokenHash, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      include: { ...INVITATION_DETAILS, ...WORKSPACE_NAMES },
    });
    if (!invitation) return null;
    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: displayNameOf(invitation.workspace),
      inviterName: invitation.invitedBy.name,
      email: invitation.email,
      role: invitation.role,
      customRole: invitation.customRole,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Marks the invitation accepted and adds the member, at once. A user who is already a member
   * keeps their role. False when the invitation was used or revoked in the meantime.
   */
  async accept(invitation: PendingInvitation, userId: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const { count } = await transaction.workspaceInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null },
        data: { acceptedAt: now },
      });
      if (count === 0) return false;
      const membership = {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
        customRoleId: invitation.customRole?.id ?? null,
      };
      await transaction.workspaceMember.createMany({ data: [membership], skipDuplicates: true });
      return true;
    });
  }

  private pendingWhere(
    workspaceId: string,
    now: Date,
  ): { workspaceId: string; acceptedAt: null; revokedAt: null; expiresAt: { gt: Date } } {
    return { workspaceId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } };
  }

  private toSummary(invitation: InvitationRow): InvitationSummary {
    const { id, email, role, expiresAt, createdAt } = invitation;
    const { customRole } = resolveRole(role, invitation.customRole);
    return {
      id,
      email,
      role,
      customRole,
      invitedByName: invitation.invitedBy.name,
      expiresAt,
      createdAt,
    };
  }
}
