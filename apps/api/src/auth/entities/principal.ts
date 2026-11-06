import type { Request } from 'express';
import type { AgentIdentity, ApiKeyIdentity, ResolvedRole } from '@crossmart/core';
import type { PrincipalKind } from '../enums/principal-kind.enum.js';

/** A signed-in person, authenticated by a Better Auth session. */
export interface UserPrincipal {
  kind: PrincipalKind.User;
  userId: string;
  name: string;
  email: string;
}

/**
 * A program (an MCP server, a script), authenticated by a workspace API key. Actions are
 * attributed to `createdById`, the user who created the key.
 */
export interface ApiKeyPrincipal extends ApiKeyIdentity {
  kind: PrincipalKind.ApiKey;
}

/**
 * An AI agent with an OAuth access token (ADR 0019), acting for `userId` in one workspace. It
 * may call workspace routes only, and its permissions are its scopes narrowed by the user's role.
 */
export interface AgentPrincipal extends AgentIdentity {
  kind: PrincipalKind.Agent;
}

export type Principal = UserPrincipal | ApiKeyPrincipal | AgentPrincipal;

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
  /** Set by the workspace guard for routes under `/workspaces/:workspaceId`. */
  workspaceAccess?: ResolvedRole;
}
