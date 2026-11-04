import { Injectable } from '@nestjs/common';
import { PrismaService, type WorkspaceRole } from '@crossmart/database';
import type { InvitationPreview, InvitationSummary } from '../entities/workspace-invitation.js';
import { workspaceDisplayName } from '../rules/workspace-display-name.js';

export interface InvitationRecord {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  tokenHash: string;
  invitedById: string;
  expiresAt: Date;
}

/** A new invitation, with what its email needs. */
export interface CreatedInvitation extends InvitationSummary {
  workspaceName: string;
}

/** A pending invitation found by its link, with what accepting it needs. */
export interface PendingInvitation extends InvitationPreview {
  id: string;
  workspaceId: string;
}

const INVITER_NAME = { invitedBy: { select: { name: true } } } as const;
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
        include: { ...INVITER_NAME, ...WORKSPACE_NAMES },
      }),
    ]);
    return { ...this.toSummary(invitation), workspaceName: displayNameOf(invitation.workspace) };
  }

  countPending(workspaceId: string, now: Date): Promise<number> {
    return this.prisma.workspaceInvitation.count({ where: this.pendingWhere(workspaceId, now) });
  }

  async listPending(workspaceId: string, now: Date): Promise<InvitationSummary[]> {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: this.pendingWhere(workspaceId, now),
      include: INVITER_NAME,
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
      include: { ...INVITER_NAME, ...WORKSPACE_NAMES },
    });
    if (!invitation) return null;
    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: displayNameOf(invitation.workspace),
      inviterName: invitation.invitedBy.name,
      email: invitation.email,
      role: invitation.role,
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
      await transaction.workspaceMember.createMany({
        data: [{ workspaceId: invitation.workspaceId, userId, role: invitation.role }],
        skipDuplicates: true,
      });
      return true;
    });
  }

  private pendingWhere(
    workspaceId: string,
    now: Date,
  ): { workspaceId: string; acceptedAt: null; revokedAt: null; expiresAt: { gt: Date } } {
    return { workspaceId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } };
  }

  private toSummary(invitation: {
    id: string;
    email: string;
    role: WorkspaceRole;
    expiresAt: Date;
    createdAt: Date;
    invitedBy: { name: string };
  }): InvitationSummary {
    const { id, email, role, expiresAt, createdAt } = invitation;
    return { id, email, role, invitedByName: invitation.invitedBy.name, expiresAt, createdAt };
  }
}
