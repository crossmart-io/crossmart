import type { Workspace } from '@crossmart/database';
import type { ResolvedRole } from '../entities/role-assignment.js';
import type { SandboxState, WorkspaceAccess } from '../entities/workspace-access.js';
import { toOutsideAgentChanges } from '../../workspace-settings/workspace-settings.repository.js';
import { workspaceDisplayName } from './workspace-display-name.js';

/** What a workspace read needs besides its own columns: its organization's name and sandbox. */
export const WORKSPACE_ACCESS_INCLUDE = {
  organization: { select: { name: true } },
  sandboxAccount: { select: { expiresAt: true, claimedAt: true } },
} as const;

/** A workspace read with `WORKSPACE_ACCESS_INCLUDE`. */
export interface WorkspaceWithOrganization extends Workspace {
  organization: { name: string };
  sandboxAccount: { expiresAt: Date; claimedAt: Date | null } | null;
}

/** A sandbox account still waiting for its owner; a claimed one is a normal workspace. */
function sandboxStateOf(workspace: WorkspaceWithOrganization): SandboxState | null {
  const sandbox = workspace.sandboxAccount;
  return sandbox && !sandbox.claimedAt ? { claimExpiresAt: sandbox.expiresAt } : null;
}

/** The workspace as one member sees it: its fields, display name, sandbox state and their role. */
export function toWorkspaceAccess(
  workspace: WorkspaceWithOrganization,
  access: ResolvedRole,
): WorkspaceAccess {
  const { id, organizationId, name, slug, currency, timeZone } = workspace;
  return {
    id,
    organizationId,
    name,
    displayName: workspaceDisplayName(name, workspace.organization.name),
    slug,
    currency,
    timeZone,
    sandbox: sandboxStateOf(workspace),
    outsideAgentChanges: toOutsideAgentChanges(workspace.outsideAgentChanges),
    ...access,
  };
}
