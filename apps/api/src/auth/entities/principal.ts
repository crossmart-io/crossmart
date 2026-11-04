import type { Request } from 'express';
import type { ApiKeyIdentity, ResolvedRole } from '@crossmart/core';
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

export type Principal = UserPrincipal | ApiKeyPrincipal;

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
  /** Set by the workspace guard for routes under `/workspaces/:workspaceId`. */
  workspaceAccess?: ResolvedRole;
}
