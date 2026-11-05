import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import {
  assertHasPermission,
  builtInPermissions,
  type BuiltInRole,
  permissionsCover,
  resolveRole,
  toPermissionList,
} from './role-permissions.js';

const VIEW_PERMISSIONS = [
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
const BUILT_IN_ROLES: BuiltInRole[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.EDITOR,
  WorkspaceRole.APPROVER,
  WorkspaceRole.VIEWER,
];
const listOf = (role: BuiltInRole) => toPermissionList(builtInPermissions(role));

describe('built-in roles', () => {
  it('let every role see everything and a viewer nothing more', () => {
    for (const role of BUILT_IN_ROLES) {
      expect(permissionsCover(builtInPermissions(role), VIEW_PERMISSIONS)).toBe(true);
    }
    expect(listOf(WorkspaceRole.VIEWER)).toEqual(VIEW_PERMISSIONS);
  });

  it('reserve deleting a workspace for the owner, who has every permission', () => {
    expect(listOf(WorkspaceRole.OWNER)).toEqual(Object.values(WorkspacePermission));
    expect(builtInPermissions(WorkspaceRole.ADMIN).has(WorkspacePermission.DeleteWorkspace)).toBe(
      false,
    );
  });

  it('let an editor work the catalog but not run stores or the team', () => {
    const editor = builtInPermissions(WorkspaceRole.EDITOR);
    expect(
      permissionsCover(editor, [
        WorkspacePermission.EditProducts,
        WorkspacePermission.EditInventory,
        WorkspacePermission.EditListings,
        WorkspacePermission.GenerateContent,
      ]),
    ).toBe(true);
    expect(editor.has(WorkspacePermission.ManageChannels)).toBe(false);
    expect(editor.has(WorkspacePermission.ManageMembers)).toBe(false);
    expect(editor.has(WorkspacePermission.ApproveSuggestions)).toBe(false);
  });

  it('let an approver review suggestions but not ask the agents for more', () => {
    const approver = builtInPermissions(WorkspaceRole.APPROVER);
    expect(approver.has(WorkspacePermission.ViewSuggestions)).toBe(true);
    expect(approver.has(WorkspacePermission.GenerateContent)).toBe(false);
  });

  it('let an approver approve and change nothing else', () => {
    expect(listOf(WorkspaceRole.APPROVER)).toEqual([
      ...VIEW_PERMISSIONS,
      WorkspacePermission.ApproveSuggestions,
    ]);
  });
});

describe('resolveRole', () => {
  const stored = {
    id: 'role-1',
    name: 'Stock clerk',
    permissions: [
      WorkspacePermission.ViewWorkspace,
      WorkspacePermission.EditInventory,
      WorkspacePermission.DeleteWorkspace,
      'reports:export',
    ],
  };

  it('keeps known permissions of a custom role and never owner-only ones', () => {
    const resolved = resolveRole(WorkspaceRole.CUSTOM, stored);
    expect(resolved.customRole).toEqual({ id: 'role-1', name: 'Stock clerk' });
    expect(toPermissionList(resolved.permissions)).toEqual([
      WorkspacePermission.ViewWorkspace,
      WorkspacePermission.EditInventory,
    ]);
  });

  it('grants nothing for a custom role that is gone', () => {
    expect(resolveRole(WorkspaceRole.CUSTOM, null).permissions.size).toBe(0);
  });

  it('ignores a custom role next to a built-in one', () => {
    expect(resolveRole(WorkspaceRole.VIEWER, stored)).toMatchObject({ customRole: null });
  });
});

describe('assertHasPermission', () => {
  it('refuses a missing permission', () => {
    const viewer = builtInPermissions(WorkspaceRole.VIEWER);
    expect(() => assertHasPermission(viewer, WorkspacePermission.EditInventory)).toThrow(
      ForbiddenException,
    );
    expect(() => assertHasPermission(viewer, WorkspacePermission.ViewOrders)).not.toThrow();
  });
});

describe('permissionsCover', () => {
  it('lets an admin grant any role but owner, and stops an editor granting approval', () => {
    const admin = builtInPermissions(WorkspaceRole.ADMIN);
    expect(permissionsCover(admin, builtInPermissions(WorkspaceRole.EDITOR))).toBe(true);
    expect(permissionsCover(admin, builtInPermissions(WorkspaceRole.OWNER))).toBe(false);
    const editor = builtInPermissions(WorkspaceRole.EDITOR);
    expect(permissionsCover(editor, builtInPermissions(WorkspaceRole.APPROVER))).toBe(false);
  });
});
