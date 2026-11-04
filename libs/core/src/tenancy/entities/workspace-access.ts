import type { ResolvedRole } from './role-assignment.js';

/** A workspace as seen by one member: the workspace plus that member's role and permissions. */
export interface WorkspaceAccess extends ResolvedRole {
  id: string;
  organizationId: string;
  name: string;
  /** The name to show: the organization's while the workspace has the default name. */
  displayName: string;
  slug: string;
  /** ISO 4217 code of the catalog's prices. */
  currency: string;
}

export interface WorkspaceMemberProfile extends ResolvedRole {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
}
