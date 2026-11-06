import { Injectable } from '@nestjs/common';
import { AgentAccessService } from '@crossmart/core';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AgentPrincipal } from '../entities/principal.js';
import { AgentTokenVerifier } from './agent-token.verifier.js';

/**
 * Turns an agent's bearer token into a principal: the token must verify, and its connection and
 * the user's membership must still stand.
 */
@Injectable()
export class AgentAuthenticator {
  constructor(
    private readonly tokens: AgentTokenVerifier,
    private readonly access: AgentAccessService,
  ) {}

  async authenticate(token: string): Promise<AgentPrincipal | null> {
    const grant = await this.tokens.verify(token);
    const identity = grant ? await this.access.authorize(grant) : null;
    return identity ? { kind: PrincipalKind.Agent, ...identity } : null;
  }
}
