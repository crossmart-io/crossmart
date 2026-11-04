import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import { roleCovers, roleHasPermission } from './role-permissions.js';

describe('roleHasPermission', () => {
  it('lets every role view the workspace', () => {
    for (const role of Object.values(WorkspaceRole)) {
      expect(roleHasPermission(role, WorkspacePermission.ViewWorkspace)).toBe(true);
    }
  });

  it('reserves deleting a workspace for the owner', () => {
    expect(roleHasPermission(WorkspaceRole.OWNER, WorkspacePermission.DeleteWorkspace)).toBe(true);
    expect(roleHasPermission(WorkspaceRole.ADMIN, WorkspacePermission.DeleteWorkspace)).toBe(false);
  });

  it('separates editing from approving', () => {
    expect(roleHasPermission(WorkspaceRole.EDITOR, WorkspacePermission.EditCatalog)).toBe(true);
    expect(roleHasPermission(WorkspaceRole.EDITOR, WorkspacePermission.ApproveSuggestions)).toBe(
      false,
    );
    expect(roleHasPermission(WorkspaceRole.APPROVER, WorkspacePermission.ApproveSuggestions)).toBe(
      true,
    );
    expect(roleHasPermission(WorkspaceRole.APPROVER, WorkspacePermission.EditCatalog)).toBe(false);
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
