import type { WorkspaceRole } from '@crossmart/database';

/** A workspace as seen by one member: the workspace plus that member's role in it. */
export interface WorkspaceAccess {
  id: string;
  organizationId: string;
  name: string;
  /** The name to show: the organization's while the workspace has the default name. */
  displayName: string;
  slug: string;
  /** ISO 4217 code of the catalog's prices. */
  currency: string;
  role: WorkspaceRole;
}

export interface WorkspaceMemberProfile {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
}
