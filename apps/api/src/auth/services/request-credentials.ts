import { Injectable } from '@nestjs/common';
import { API_KEY_HEADER } from '@crossmart/common';
import { AGENT_WORKER_TOKEN_HEADER, ApiKeysService } from '@crossmart/core';
import { AUTHORIZATION_HEADER, BEARER_SCHEME, LOOPBACK_ADDRESSES } from '../auth.constants.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';
import { AgentAuthenticator } from './agent-authenticator.js';
import { AgentWorkerAuthenticator } from './agent-worker-authenticator.js';

/**
 * The credentials a request carries in its headers, other than a session cookie: an API key, an
 * agent's access token, or Agent Worker's internal credential. A credential that is present but
 * wrong resolves to null; it never falls back to another kind.
 */
@Injectable()
export class RequestCredentials {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly agents: AgentAuthenticator,
    private readonly agentWorker: AgentWorkerAuthenticator,
  ) {}

  /** True when the request presents a header credential, right or wrong. */
  present(request: AuthenticatedRequest): boolean {
    return (
      request.header(API_KEY_HEADER) !== undefined ||
      request.header(AGENT_WORKER_TOKEN_HEADER) !== undefined ||
      this.bearerToken(request) !== undefined
    );
  }

  /** The caller the header credential names; null when it is wrong. Call only when `present`. */
  async resolve(request: AuthenticatedRequest): Promise<Principal | null> {
    const agentWorkerToken = request.header(AGENT_WORKER_TOKEN_HEADER);
    if (agentWorkerToken !== undefined) {
      return this.isLoopback(request) ? this.agentWorker.authenticate(agentWorkerToken) : null;
    }
    const apiKey = request.header(API_KEY_HEADER);
    if (apiKey !== undefined) {
      const identity = await this.apiKeys.authenticate(apiKey);
      return identity ? { kind: PrincipalKind.ApiKey, ...identity } : null;
    }
    const bearer = this.bearerToken(request);
    return bearer === undefined ? null : this.agents.authenticate(bearer);
  }

  /**
   * Agent Worker calls the API from inside the server, so its credential is only accepted on a
   * connection from this machine; a forwarded request never qualifies, whatever it sends.
   */
  private isLoopback(request: AuthenticatedRequest): boolean {
    const address = request.socket.remoteAddress;
    return address !== undefined && LOOPBACK_ADDRESSES.has(address);
  }

  private bearerToken(request: AuthenticatedRequest): string | undefined {
    const [scheme, token] = request.header(AUTHORIZATION_HEADER)?.split(' ') ?? [];
    return scheme === BEARER_SCHEME && token ? token : undefined;
  }
}
