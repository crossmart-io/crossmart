import type { WorkspaceRole } from '@crossmart/database';

export interface NewInvitation {
  email: string;
  role: WorkspaceRole;
}

/** The member or API key acting, with the role that caps what they may grant. */
export interface MembershipManager {
  userId: string;
  role: WorkspaceRole;
}

/** A pending invitation, as the workspace's managers see it. */
export interface InvitationSummary {
  id: string;
  email: string;
  role: WorkspaceRole;
  invitedByName: string;
  expiresAt: Date;
  createdAt: Date;
}

/** What the invitation link shows before the invitee accepts it. */
export interface InvitationPreview {
  /** The workspace's display name. */
  workspaceName: string;
  inviterName: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: Date;
}

/** The signed-in user accepting an invitation. */
export interface Invitee {
  userId: string;
  email: string;
}

export interface AcceptedInvitation {
  workspaceId: string;
  role: WorkspaceRole;
}
