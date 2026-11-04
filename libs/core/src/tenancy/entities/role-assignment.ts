import type { WorkspaceRole } from '@crossmart/database';
import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';

/** A role as a member, invitation or API key holds it: a built-in role, or CUSTOM and its id. */
export interface RoleAssignment {
  role: WorkspaceRole;
  /** Set exactly when `role` is CUSTOM. */
  customRoleId?: string | null;
}

export interface CustomRoleRef {
  id: string;
  name: string;
}

/** A custom role as stored: permissions are the raw strings of the database. */
export interface StoredCustomRole extends CustomRoleRef {
  permissions: string[];
}

/** A role with what it allows, ready for permission checks. */
export interface ResolvedRole {
  role: WorkspaceRole;
  /** The workspace's own role when `role` is CUSTOM. */
  customRole: CustomRoleRef | null;
  permissions: ReadonlySet<WorkspacePermission>;
}
