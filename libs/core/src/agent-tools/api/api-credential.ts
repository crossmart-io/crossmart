import type { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { API_KEY_HEADER, AUTHORIZATION_HEADER, BEARER_PREFIX } from '../agent-tools.constants.js';

/** How the server's calls to the API authenticate, and what that allows. */
export interface ApiCredential {
  /** Headers that carry the credential on every API call. */
  headers: Readonly<Record<string, string>>;
  /** The workspace an agent token names; an API key's is asked from the API. */
  workspaceId?: string;
  /** An agent's scopes; absent for an API key, whose role alone decides. */
  scopes?: readonly AgentScope[];
}

/** A workspace API key, as people paste into an MCP client. */
export function apiKeyCredential(apiKey: string): ApiCredential {
  return { headers: { [API_KEY_HEADER]: apiKey } };
}

/** An agent's OAuth access token, already verified, with what it names. */
export function accessTokenCredential(
  accessToken: string,
  workspaceId: string,
  scopes: readonly AgentScope[],
): ApiCredential {
  return {
    headers: { [AUTHORIZATION_HEADER]: `${BEARER_PREFIX}${accessToken}` },
    workspaceId,
    scopes,
  };
}
