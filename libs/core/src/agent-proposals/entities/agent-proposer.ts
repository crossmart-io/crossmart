import type { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { AgentProposerKind } from '../enums/agent-proposer-kind.enum.js';

/** The outside agent that proposes a change, as the API identified it (ADR 0028). */
export interface AgentProposer {
  kind: AgentProposerKind;
  workspaceId: string;
  /** The person the agent acts for, or who created the key. */
  userId: string;
  /** The OAuth client, for an OAuth agent. */
  oauthClientId: string | null;
  /** The key, for an MCP session with an API key. */
  apiKeyId: string | null;
  /** "Claude"; for a key, the key's name. */
  agentName: string;
  /** An OAuth agent's scopes; empty for a key. */
  scopes: readonly AgentScope[];
  /** What it may do now: scopes narrowed by the role, or the key's role. */
  permissions: ReadonlySet<WorkspacePermission>;
}

/** Whoever reads a proposal as its proposer: it sees only its own. */
export type AgentProposerRef = Pick<
  AgentProposer,
  'kind' | 'workspaceId' | 'userId' | 'oauthClientId' | 'apiKeyId'
>;

/** A call an agent sends to be proposed. */
export interface AgentProposalRequest {
  tool: string;
  input: Record<string, unknown>;
}

/** The person deciding, with what they may do in the workspace now. */
export interface AgentProposalReviewer {
  userId: string;
  permissions: ReadonlySet<WorkspacePermission>;
}
