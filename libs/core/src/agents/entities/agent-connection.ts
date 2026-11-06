import type { AgentClientRegistration } from '../enums/agent-client-registration.enum.js';
import type { AgentScope } from '../enums/agent-scope.enum.js';

/** An agent a user connected to a workspace: one OAuth consent. */
export interface AgentConnection {
  /** The consent's id. */
  id: string;
  clientId: string;
  clientName: string;
  /** Whether its name comes from a verified host or is only what it calls itself. */
  clientRegistration: AgentClientRegistration;
  /** For a metadata document client: the host its name and details came from. */
  clientVerifiedHost: string | null;
  /** The agent's home page, as its metadata gives it. */
  clientUri: string | null;
  /** The agent's logo address, as its metadata gives it. Never fetched by Crossmart. */
  clientIcon: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  scopes: AgentScope[];
  connectedAt: Date;
}

/** Who asks to see or revoke connections, with their permissions in the workspace. */
export interface AgentConnectionViewer {
  userId: string;
  /** True when the viewer may see and revoke every member's connections, not only their own. */
  managesAll: boolean;
}
