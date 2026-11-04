import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';

/** Seeing everything in a workspace, changing nothing. */
const READ_ONLY: readonly WorkspacePermission[] = [
  WorkspacePermission.ViewWorkspace,
  WorkspacePermission.ViewMembers,
  WorkspacePermission.ViewProducts,
  WorkspacePermission.ViewInventory,
  WorkspacePermission.ViewOrders,
  WorkspacePermission.ViewReports,
  WorkspacePermission.ViewChannels,
  WorkspacePermission.ViewActivity,
];

/** Day-to-day catalog work: products, stock and what each store lists. */
const CATALOG_WORK: readonly WorkspacePermission[] = [
  WorkspacePermission.EditProducts,
  WorkspacePermission.EditInventory,
  WorkspacePermission.EditListings,
];

const ADMINISTRATION: readonly WorkspacePermission[] = [
  ...CATALOG_WORK,
  WorkspacePermission.ManageWorkspace,
  WorkspacePermission.ManageMembers,
  WorkspacePermission.ManageApiKeys,
  WorkspacePermission.ManageChannels,
  WorkspacePermission.ApproveSuggestions,
];

const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, ReadonlySet<WorkspacePermission>>> = {
  [WorkspaceRole.OWNER]: new Set([
    ...READ_ONLY,
    ...ADMINISTRATION,
    WorkspacePermission.DeleteWorkspace,
  ]),
  [WorkspaceRole.ADMIN]: new Set([...READ_ONLY, ...ADMINISTRATION]),
  [WorkspaceRole.EDITOR]: new Set([...READ_ONLY, ...CATALOG_WORK]),
  [WorkspaceRole.APPROVER]: new Set([...READ_ONLY, WorkspacePermission.ApproveSuggestions]),
  [WorkspaceRole.VIEWER]: new Set(READ_ONLY),
};

export function roleHasPermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Every permission of a role, in the enum's order, for clients that adapt to what one may do. */
export function permissionsOf(role: WorkspaceRole): WorkspacePermission[] {
  return Object.values(WorkspacePermission).filter((permission) =>
    roleHasPermission(role, permission),
  );
}

/** For checks a route guard cannot make, such as one that depends on the request body. */
export function assertRoleHasPermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): void {
  if (!roleHasPermission(role, permission)) {
    throw new ForbiddenException(`Requires the ${permission} permission`);
  }
}

/** True when `role` holds every permission of `otherRole`, so granting it is not an escalation. */
export function roleCovers(role: WorkspaceRole, otherRole: WorkspaceRole): boolean {
  return [...ROLE_PERMISSIONS[otherRole]].every((permission) =>
    roleHasPermission(role, permission),
  );
}
