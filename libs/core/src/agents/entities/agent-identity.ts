import type { ResolvedRole } from '../../tenancy/entities/role-assignment.js';
import type { AgentScope } from '../enums/agent-scope.enum.js';

/** What a verified access token says: which agent acts for which user, where, with what scopes. */
export interface AgentGrant {
  userId: string;
  /** The OAuth client id: a Client ID Metadata Document URL, or a registered id. */
  clientId: string;
  workspaceId: string;
  scopes: readonly AgentScope[];
}

/**
 * An agent allowed to act right now: its grant, plus what it may do. `permissions` already
 * combines the scopes with the user's current role, so it narrows when either does.
 */
export interface AgentIdentity extends ResolvedRole {
  userId: string;
  clientId: string;
  /** The name the agent gave, such as "Claude". */
  clientName: string;
  workspaceId: string;
  scopes: readonly AgentScope[];
}
