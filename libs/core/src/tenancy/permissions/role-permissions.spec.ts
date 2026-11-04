import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import {
  assertRoleHasPermission,
  permissionsOf,
  roleCovers,
  roleHasPermission,
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
];

describe('roleHasPermission', () => {
  it('lets every role see everything', () => {
    for (const role of Object.values(WorkspaceRole)) {
      for (const permission of VIEW_PERMISSIONS) {
        expect(roleHasPermission(role, permission)).toBe(true);
      }
    }
  });

  it('gives a viewer nothing more', () => {
    expect(permissionsOf(WorkspaceRole.VIEWER)).toEqual(VIEW_PERMISSIONS);
  });

  it('reserves deleting a workspace for the owner', () => {
    expect(roleHasPermission(WorkspaceRole.OWNER, WorkspacePermission.DeleteWorkspace)).toBe(true);
    expect(roleHasPermission(WorkspaceRole.ADMIN, WorkspacePermission.DeleteWorkspace)).toBe(false);
  });

  it('lets an editor work the catalog but not run stores or the team', () => {
    const editor = new Set(permissionsOf(WorkspaceRole.EDITOR));
    expect(editor).toContain(WorkspacePermission.EditProducts);
    expect(editor).toContain(WorkspacePermission.EditInventory);
    expect(editor).toContain(WorkspacePermission.EditListings);
    expect(editor).not.toContain(WorkspacePermission.ManageChannels);
    expect(editor).not.toContain(WorkspacePermission.ManageMembers);
    expect(editor).not.toContain(WorkspacePermission.ApproveSuggestions);
  });

  it('lets an approver approve and change nothing else', () => {
    expect(permissionsOf(WorkspaceRole.APPROVER)).toEqual([
      ...VIEW_PERMISSIONS,
      WorkspacePermission.ApproveSuggestions,
    ]);
  });

  it('gives the owner every permission', () => {
    expect(permissionsOf(WorkspaceRole.OWNER)).toEqual(Object.values(WorkspacePermission));
  });
});

describe('assertRoleHasPermission', () => {
  it('refuses a missing permission', () => {
    expect(() =>
      assertRoleHasPermission(WorkspaceRole.VIEWER, WorkspacePermission.EditInventory),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertRoleHasPermission(WorkspaceRole.EDITOR, WorkspacePermission.EditInventory),
    ).not.toThrow();
  });
});

describe('roleCovers', () => {
  it('lets an admin grant any role but owner', () => {
    expect(roleCovers(WorkspaceRole.ADMIN, WorkspaceRole.EDITOR)).toBe(true);
    expect(roleCovers(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)).toBe(false);
  });

  it('stops an editor from granting approval rights', () => {
    expect(roleCovers(WorkspaceRole.EDITOR, WorkspaceRole.APPROVER)).toBe(false);
    expect(roleCovers(WorkspaceRole.EDITOR, WorkspaceRole.VIEWER)).toBe(true);
  });
});
