import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';

const READ_ONLY: readonly WorkspacePermission[] = [
  WorkspacePermission.ViewWorkspace,
  WorkspacePermission.ViewMembers,
];

const ADMINISTRATION: readonly WorkspacePermission[] = [
  WorkspacePermission.ManageWorkspace,
  WorkspacePermission.ManageMembers,
  WorkspacePermission.ManageApiKeys,
  WorkspacePermission.EditCatalog,
  WorkspacePermission.ApproveSuggestions,
];

const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, ReadonlySet<WorkspacePermission>>> = {
  [WorkspaceRole.OWNER]: new Set([
    ...READ_ONLY,
    ...ADMINISTRATION,
    WorkspacePermission.DeleteWorkspace,
  ]),
  [WorkspaceRole.ADMIN]: new Set([...READ_ONLY, ...ADMINISTRATION]),
  [WorkspaceRole.EDITOR]: new Set([...READ_ONLY, WorkspacePermission.EditCatalog]),
  [WorkspaceRole.APPROVER]: new Set([...READ_ONLY, WorkspacePermission.ApproveSuggestions]),
  [WorkspaceRole.VIEWER]: new Set(READ_ONLY),
};

export function roleHasPermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** True when `role` holds every permission of `otherRole`, so granting it is not an escalation. */
export function roleCovers(role: WorkspaceRole, otherRole: WorkspaceRole): boolean {
  return [...ROLE_PERMISSIONS[otherRole]].every((permission) =>
    roleHasPermission(role, permission),
  );
}
