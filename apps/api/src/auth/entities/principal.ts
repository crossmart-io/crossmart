import type { Request } from 'express';
import type { WorkspaceRole } from '@crossmart/database';
import type { PrincipalKind } from '../enums/principal-kind.enum.js';

/** A signed-in person, authenticated by a Better Auth session. */
export interface UserPrincipal {
  kind: PrincipalKind.User;
  userId: string;
  name: string;
  email: string;
}

/** A program (an MCP server, a script), authenticated by a workspace API key. */
export interface ApiKeyPrincipal {
  kind: PrincipalKind.ApiKey;
  apiKeyId: string;
  workspaceId: string;
  role: WorkspaceRole;
  /** The user who created the key; actions are attributed to them. */
  createdById: string;
}

export type Principal = UserPrincipal | ApiKeyPrincipal;

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
  /** Set by the workspace guard for routes under `/workspaces/:workspaceId`. */
  workspaceRole?: WorkspaceRole;
}
