import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';

export interface CustomRoleInput {
  name: string;
  description?: string | null;
  permissions: WorkspacePermission[];
}

export interface CustomRoleSummary {
  id: string;
  name: string;
  description: string | null;
  permissions: WorkspacePermission[];
  /** Members holding the role now. */
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Where a role is still in use, which blocks deleting it. */
export interface CustomRoleUsage {
  members: number;
  pendingInvitations: number;
  activeApiKeys: number;
}
