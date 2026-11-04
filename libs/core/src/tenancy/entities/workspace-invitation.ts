import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import type { CustomRoleRef, ResolvedRole, RoleAssignment } from './role-assignment.js';

export interface NewInvitation extends RoleAssignment {
  email: string;
}

/** The member or API key acting, with the permissions that cap what they may grant. */
export interface MembershipManager {
  userId: string;
  permissions: ReadonlySet<WorkspacePermission>;
}

/** A pending invitation, as the workspace's managers see it. */
export interface InvitationSummary {
  id: string;
  email: string;
  role: ResolvedRole['role'];
  customRole: CustomRoleRef | null;
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
  role: ResolvedRole['role'];
  /** The role as people read it: a built-in role's name or the custom role's. */
  roleName: string;
  expiresAt: Date;
}

/** The signed-in user accepting an invitation. */
export interface Invitee {
  userId: string;
  email: string;
}

export interface AcceptedInvitation {
  workspaceId: string;
  role: ResolvedRole['role'];
}
