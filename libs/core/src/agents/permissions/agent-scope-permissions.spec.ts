import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { resolveRole } from '../../tenancy/permissions/role-permissions.js';
import { AgentScope } from '../enums/agent-scope.enum.js';
import { agentPermissions, parseAgentScopes } from './agent-scope-permissions.js';

const OWNER = resolveRole(WorkspaceRole.OWNER, null).permissions;
const EDITOR = resolveRole(WorkspaceRole.EDITOR, null).permissions;

describe('parseAgentScopes', () => {
  it('keeps Crossmart scopes once, from a scope string or a list', () => {
    expect(parseAgentScopes('openid catalog:read offline_access catalog:read')).toEqual([
      AgentScope.CatalogRead,
    ]);
    expect(parseAgentScopes(['orders:read', 'nonsense'])).toEqual([AgentScope.OrdersRead]);
  });
});

describe('agentPermissions', () => {
  it('grants nothing without a scope', () => {
    expect(agentPermissions([], OWNER).size).toBe(0);
  });

  it('opens the workspace and what the scope covers', () => {
    expect([...agentPermissions([AgentScope.OrdersRead], OWNER)]).toEqual([
      WorkspacePermission.ViewWorkspace,
      WorkspacePermission.ViewOrders,
    ]);
  });

  it('never goes beyond the user’s role', () => {
    const permissions = agentPermissions([AgentScope.SuggestionsWrite], EDITOR);
    expect(permissions.has(WorkspacePermission.GenerateContent)).toBe(true);
    expect(permissions.has(WorkspacePermission.ApproveSuggestions)).toBe(false);
  });

  it('never reaches members, keys, store connections, settings or billing, even for an owner', () => {
    const permissions = agentPermissions(Object.values(AgentScope), OWNER);
    for (const forbidden of [
      WorkspacePermission.ManageMembers,
      WorkspacePermission.ManageApiKeys,
      WorkspacePermission.ManageChannels,
      WorkspacePermission.ManageWorkspace,
      WorkspacePermission.DeleteWorkspace,
      WorkspacePermission.ViewBilling,
    ]) {
      expect(permissions.has(forbidden)).toBe(false);
    }
  });
});
