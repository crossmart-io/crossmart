import { createRemoteJWKSet, errors, type JWTPayload, jwtVerify } from 'jose';
import { AGENT_WORKSPACE_CLAIM } from '@crossmart/core/agents/agents.constants.js';
import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import type { McpConfig } from '../config/mcp-config.js';
import { JWKS_PATH, SCOPE_CLAIM, SCOPE_SEPARATOR } from '../mcp.constants.js';

/** What a valid agent access token says. */
export interface AgentTokenClaims {
  workspaceId: string;
  scopes: AgentScope[];
}

const KNOWN_SCOPES = new Set<string>(Object.values(AgentScope));

function isAgentScope(value: string): value is AgentScope {
  return KNOWN_SCOPES.has(value);
}

function toClaims(payload: JWTPayload): AgentTokenClaims | null {
  const workspaceId = payload[AGENT_WORKSPACE_CLAIM];
  const scope = payload[SCOPE_CLAIM];
  if (typeof workspaceId !== 'string' || typeof scope !== 'string') return null;
  const scopes = scope.split(SCOPE_SEPARATOR).filter(isAgentScope);
  return scopes.length > 0 ? { workspaceId, scopes } : null;
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
