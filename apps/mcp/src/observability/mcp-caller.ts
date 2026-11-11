import { API_KEY_VISIBLE_PREFIX_LENGTH } from '@crossmart/core/tenancy/api-key-format.js';
import type { AgentTokenClaims } from '../auth/access-token.verifier.js';
import { McpCallerKind } from './mcp-log.constants.js';

/**
 * Who a request came from, as the request log names it: ids only, never a token or an email.
 * An API key is named by its visible prefix, the part the web app shows to tell keys apart.
 */
export interface McpCaller {
  kind: McpCallerKind;
  /** The user an agent acts for, or the key's visible prefix. */
  principalId?: string;
  /** The agent's OAuth client id. */
  clientId?: string;
  /** The workspace, when the credential names it; an API key's is learned on its first call. */
  workspaceId?: string;
}

export function agentCaller(claims: AgentTokenClaims): McpCaller {
  return {
    kind: McpCallerKind.Agent,
    workspaceId: claims.workspaceId,
    ...(claims.userId ? { principalId: claims.userId } : {}),
    ...(claims.clientId ? { clientId: claims.clientId } : {}),
  };
}

export function apiKeyCaller(apiKey: string): McpCaller {
  return {
    kind: McpCallerKind.ApiKey,
    principalId: apiKey.slice(0, API_KEY_VISIBLE_PREFIX_LENGTH),
  };
}
