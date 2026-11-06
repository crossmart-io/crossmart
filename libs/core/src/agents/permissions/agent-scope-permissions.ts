import { findEnumValue } from '@crossmart/common';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { SCOPE_SEPARATOR } from '../agents.constants.js';
import { AgentScope } from '../enums/agent-scope.enum.js';

/**
 * The workspace permissions each scope can unlock. Members, API keys, store connections,
 * settings and billing are never reachable by an agent, whatever the user's role. Webhook
 * endpoints are, only with their own scope (`webhooks:write`).
 */
const SCOPE_PERMISSIONS: Readonly<Record<AgentScope, readonly WorkspacePermission[]>> = {
  [AgentScope.CatalogRead]: [
    WorkspacePermission.ViewProducts,
    WorkspacePermission.ViewInventory,
    WorkspacePermission.ViewChannels,
    WorkspacePermission.ViewSuggestions,
  ],
  [AgentScope.CatalogWrite]: [WorkspacePermission.EditProducts, WorkspacePermission.EditInventory],
  [AgentScope.OrdersRead]: [WorkspacePermission.ViewOrders],
  [AgentScope.StoresWrite]: [WorkspacePermission.EditListings],
  [AgentScope.ReportsRead]: [WorkspacePermission.ViewReports],
  [AgentScope.SuggestionsWrite]: [
    WorkspacePermission.GenerateContent,
    WorkspacePermission.ApproveSuggestions,
  ],
  [AgentScope.WebhooksWrite]: [WorkspacePermission.ManageWebhooks],
};

/** The Crossmart scopes in an OAuth `scope` value or list; unknown and OpenID scopes drop out. */
export function parseAgentScopes(scopes: string | readonly string[]): AgentScope[] {
  const values = typeof scopes === 'string' ? scopes.split(SCOPE_SEPARATOR) : scopes;
  const known = values.flatMap((value) => {
    const scope = findEnumValue(AgentScope, value);
    return scope ? [scope] : [];
  });
  return [...new Set(known)];
}

/**
 * What an agent may do: the permissions its scopes unlock that the user's role also holds.
 * Opening the workspace comes with any scope.
 */
export function agentPermissions(
  scopes: readonly AgentScope[],
  rolePermissions: ReadonlySet<WorkspacePermission>,
): Set<WorkspacePermission> {
  if (scopes.length === 0) return new Set();
  const unlocked = [
    WorkspacePermission.ViewWorkspace,
    ...scopes.flatMap((scope) => SCOPE_PERMISSIONS[scope]),
  ];
  return new Set(unlocked.filter((permission) => rolePermissions.has(permission)));
}
