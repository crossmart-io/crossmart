import { Injectable } from '@nestjs/common';
import {
  AgentAccessService,
  AgentProposalRepository,
  AgentProposalTokenService,
  AgentProposerKind,
  ApiKeysService,
  parseAgentScopes,
} from '@crossmart/core';
import type { AgentProposal } from '@crossmart/database';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AgentPrincipal, ApiKeyPrincipal } from '../entities/principal.js';

/**
 * Turns the credential the API applies an approved proposal with (ADR 0028) into the proposer
 * as it stands now: the proposal must be being applied, the agent's connection must still stand
 * (or the key must not be revoked), and its scopes are narrowed by the user's current role. The
 * principal carries who approved it, for the activity log.
 */
@Injectable()
export class AgentProposalAuthenticator {
  constructor(
    private readonly tokens: AgentProposalTokenService,
    private readonly proposals: AgentProposalRepository,
    private readonly agents: AgentAccessService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async authenticate(token: string): Promise<AgentPrincipal | ApiKeyPrincipal | null> {
    const grant = await this.tokens.verify(token);
    if (!grant) return null;
    const proposal = await this.proposals.findApplying(grant.workspaceId, grant.proposalId);
    if (!proposal) return null;
    return proposal.proposerKind === AgentProposerKind.ApiKey
      ? this.asApiKey(proposal, grant.approvedByUserId)
      : this.asAgent(proposal, grant.approvedByUserId);
  }

  private async asAgent(
    proposal: AgentProposal,
    approvedByUserId: string,
  ): Promise<AgentPrincipal | null> {
    if (!proposal.oauthClientId) return null;
    const identity = await this.agents.authorize({
      userId: proposal.userId,
      clientId: proposal.oauthClientId,
      workspaceId: proposal.workspaceId,
      scopes: parseAgentScopes(proposal.scopes),
    });
    return identity ? { kind: PrincipalKind.Agent, ...identity, approvedByUserId } : null;
  }

  private async asApiKey(
    proposal: AgentProposal,
    approvedByUserId: string,
  ): Promise<ApiKeyPrincipal | null> {
    if (!proposal.apiKeyId) return null;
    const identity = await this.apiKeys.identify(proposal.workspaceId, proposal.apiKeyId);
    return identity ? { kind: PrincipalKind.ApiKey, ...identity, approvedByUserId } : null;
  }
}
