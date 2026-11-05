import { Injectable, Logger } from '@nestjs/common';
import { createLocalJWKSet, errors, type JWTPayload, jwtVerify } from 'jose';
import { AppConfigService } from '@crossmart/common';
import { AGENT_WORKSPACE_CLAIM, type AgentGrant, parseAgentScopes } from '@crossmart/core';
import { AGENT_TOKEN_KEYS_TTL_MS, CLIENT_ID_CLAIMS, SCOPE_CLAIM } from '../auth.constants.js';
import { AuthService } from './auth.service.js';

interface CachedKeys {
  issuer: string;
  keySet: ReturnType<typeof createLocalJWKSet>;
  expiresAt: number;
}

function stringClaim(payload: JWTPayload, name: string): string | undefined {
  const value = payload[name];
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Verifies agent access tokens (signed JWTs) in process: signature against Better Auth's keys,
 * issuer, expiry, and an audience of the MCP server, the only resource agents get tokens for.
 * The keys are cached and read again when a token names one not seen yet (a key rotation).
 */
@Injectable()
export class AgentTokenVerifier {
  private readonly logger = new Logger(AgentTokenVerifier.name);
  private keys: Promise<CachedKeys> | undefined;

  constructor(
    private readonly auth: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  /** The grant a valid token carries, or null when the token must be refused. */
  async verify(token: string): Promise<AgentGrant | null> {
    try {
      return this.toGrant(await this.verifyJwt(token));
    } catch (error) {
      if (!(error instanceof errors.JOSEError)) throw error;
      this.logger.debug(`Refused an agent token: ${error.code}`);
      return null;
    }
  }

  private async verifyJwt(token: string): Promise<JWTPayload> {
    try {
      return await this.verifyWith(await this.currentKeys(), token);
    } catch (error) {
      if (!(error instanceof errors.JWKSNoMatchingKey)) throw error;
      return this.verifyWith(await this.currentKeys(true), token);
    }
  }

  private async verifyWith({ issuer, keySet }: CachedKeys, token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, keySet, {
      issuer,
      audience: this.appConfig.mcpPublicUrl,
    });
    return payload;
  }

  /** The cached keys while fresh; read again when stale, missing or `refresh` is asked for. */
  private async currentKeys(refresh = false): Promise<CachedKeys> {
    if (!refresh && this.keys) {
      const keys = await this.keys;
      if (keys.expiresAt > Date.now()) return keys;
    }
    const loading = this.loadKeys();
    this.keys = loading;
    loading.catch(() => {
      if (this.keys === loading) this.keys = undefined;
    });
    return loading;
  }

  private async loadKeys(): Promise<CachedKeys> {
    const { issuer, jwks } = await this.auth.agentTokenKeys();
    return {
      issuer,
      keySet: createLocalJWKSet(jwks),
      expiresAt: Date.now() + AGENT_TOKEN_KEYS_TTL_MS,
    };
  }

  private toGrant(payload: JWTPayload): AgentGrant | null {
    const userId = payload.sub;
    const workspaceId = stringClaim(payload, AGENT_WORKSPACE_CLAIM);
    const clientId = CLIENT_ID_CLAIMS.map((claim) => stringClaim(payload, claim)).find(Boolean);
    const scopes = parseAgentScopes(stringClaim(payload, SCOPE_CLAIM) ?? '');
    if (!userId || !workspaceId || !clientId || scopes.length === 0) return null;
    return { userId, clientId, workspaceId, scopes };
  }
}
