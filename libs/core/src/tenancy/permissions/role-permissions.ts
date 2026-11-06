import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import type { ResolvedRole, StoredCustomRole } from '../entities/role-assignment.js';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';

/** The roles every workspace has. CUSTOM is a placeholder for the workspace's own roles. */
export type BuiltInRole = Exclude<WorkspaceRole, typeof WorkspaceRole.CUSTOM>;

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
  WorkspacePermission.ViewSuggestions,
];

/**
 * Day-to-day catalog work: products, stock, what each store lists, and asking the AI agents
 * for content. Their suggestions still need someone who may approve them.
 */
const CATALOG_WORK: readonly WorkspacePermission[] = [
  WorkspacePermission.EditProducts,
  WorkspacePermission.EditInventory,
  WorkspacePermission.EditListings,
  WorkspacePermission.GenerateContent,
];

const ADMINISTRATION: readonly WorkspacePermission[] = [
  ...CATALOG_WORK,
  WorkspacePermission.ManageWorkspace,
  WorkspacePermission.ManageMembers,
  WorkspacePermission.ManageApiKeys,
  WorkspacePermission.ManageWebhooks,
  WorkspacePermission.ManageChannels,
  WorkspacePermission.ApproveSuggestions,
  WorkspacePermission.ViewBilling,
];

const BUILT_IN_PERMISSIONS: Readonly<Record<BuiltInRole, ReadonlySet<WorkspacePermission>>> = {
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

/** Permissions only an owner holds; a custom role can never carry them. */
export const OWNER_ONLY_PERMISSIONS: readonly WorkspacePermission[] = [
  WorkspacePermission.DeleteWorkspace,
];

const NO_PERMISSIONS: ReadonlySet<WorkspacePermission> = new Set();

/** Every built-in role, most access first. */
export const BUILT_IN_ROLES: readonly BuiltInRole[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.EDITOR,
  WorkspaceRole.APPROVER,
  WorkspaceRole.VIEWER,
];

export function isBuiltInRole(role: WorkspaceRole): role is BuiltInRole {
  return role !== WorkspaceRole.CUSTOM;
}

export function builtInPermissions(role: BuiltInRole): ReadonlySet<WorkspacePermission> {
  return BUILT_IN_PERMISSIONS[role];
}

/** A stored permission list, keeping only values this version knows and custom roles may hold. */
export function customRolePermissions(stored: readonly string[]): Set<WorkspacePermission> {
  return new Set(
    Object.values(WorkspacePermission).filter(
      (permission) => stored.includes(permission) && !OWNER_ONLY_PERMISSIONS.includes(permission),
    ),
  );
}

/**
 * What a role allows. A CUSTOM role whose definition is gone (deleted) allows nothing, so a
 * dangling reference fails closed.
 */
export function resolveRole(
  role: WorkspaceRole,
  customRole: StoredCustomRole | null,
): ResolvedRole {
  if (isBuiltInRole(role)) {
    return { role, customRole: null, permissions: BUILT_IN_PERMISSIONS[role] };
  }
  if (!customRole) {
    return { role, customRole: null, permissions: NO_PERMISSIONS };
  }
  const { id, name, permissions } = customRole;
  return { role, customRole: { id, name }, permissions: customRolePermissions(permissions) };
}

/** True when `holder` has every permission in `wanted`, so granting `wanted` is no escalation. */
export function permissionsCover(
  holder: ReadonlySet<WorkspacePermission>,
  wanted: Iterable<WorkspacePermission>,
): boolean {
  return [...wanted].every((permission) => holder.has(permission));
}

/** For checks a route guard cannot make, such as one that depends on the request body. */
export function assertHasPermission(
  permissions: ReadonlySet<WorkspacePermission>,
  permission: WorkspacePermission,
): void {
  if (!permissions.has(permission)) {
    throw new ForbiddenException(`Requires the ${permission} permission`);
  }
}

/** A permission set in the enum's order, for responses. */
export function toPermissionList(
  permissions: ReadonlySet<WorkspacePermission>,
): WorkspacePermission[] {
  return Object.values(WorkspacePermission).filter((permission) => permissions.has(permission));
}
