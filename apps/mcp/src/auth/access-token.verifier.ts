import { createRemoteJWKSet, errors, type JWTPayload, jwtVerify } from 'jose';
import { AGENT_WORKSPACE_CLAIM } from '@crossmart/core/agents/agents.constants.js';
import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import type { McpConfig } from '../config/mcp-config.js';
import { CLIENT_ID_CLAIMS, JWKS_PATH, SCOPE_CLAIM, SCOPE_SEPARATOR } from '../mcp.constants.js';

/** What a valid agent access token says. */
export interface AgentTokenClaims {
  workspaceId: string;
  scopes: AgentScope[];
  /** The user the agent acts for (`sub`), when the token names one. */
  userId?: string;
  /** The agent's OAuth client id, when the token names one: its metadata URL or a DCR id. */
  clientId?: string;
}

const KNOWN_SCOPES = new Set<string>(Object.values(AgentScope));

function isAgentScope(value: string): value is AgentScope {
  return KNOWN_SCOPES.has(value);
}

function stringClaim(payload: JWTPayload, name: string): string | undefined {
  const value = payload[name];
  return typeof value === 'string' && value ? value : undefined;
}

/** Who the token is for, for the request log; neither is needed to serve the request. */
function toParties(payload: JWTPayload): Pick<AgentTokenClaims, 'userId' | 'clientId'> {
  const clientId = CLIENT_ID_CLAIMS.map((claim) => stringClaim(payload, claim)).find(Boolean);
  return {
    ...(payload.sub ? { userId: payload.sub } : {}),
    ...(clientId ? { clientId } : {}),
  };
}

function toClaims(payload: JWTPayload): AgentTokenClaims | null {
  const workspaceId = stringClaim(payload, AGENT_WORKSPACE_CLAIM);
  const scope = stringClaim(payload, SCOPE_CLAIM);
  if (!workspaceId || !scope) return null;
  const scopes = scope.split(SCOPE_SEPARATOR).filter(isAgentScope);
  return scopes.length > 0 ? { workspaceId, scopes, ...toParties(payload) } : null;
}

/**
 * Checks agent access tokens against the API's published keys: signature, issuer, expiry, and an
 * audience of this server. The API checks them again, along with the connection and the user's
 * role, on every call.
 */
export class AccessTokenVerifier {
  private readonly keys: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: Pick<McpConfig, 'authIssuer' | 'publicUrl'>) {
    this.keys = createRemoteJWKSet(new URL(`${config.authIssuer}${JWKS_PATH}`));
  }

  /** The token's claims, or null when it is not a valid agent token for this server. */
  async verify(token: string): Promise<AgentTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.keys, {
        issuer: this.config.authIssuer,
        audience: this.config.publicUrl,
      });
      return toClaims(payload);
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;
      throw error;
    }
  }
}
