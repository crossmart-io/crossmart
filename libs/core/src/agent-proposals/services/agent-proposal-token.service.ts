import { Injectable } from '@nestjs/common';
import { AppConfigService, InternalToken } from '@crossmart/common';
import {
  AGENT_PROPOSAL_ID_CLAIM,
  AGENT_PROPOSAL_TOKEN_AUDIENCE,
  AGENT_PROPOSAL_TOKEN_ISSUER,
  AGENT_PROPOSAL_TOKEN_KEY_CONTEXT,
  AGENT_PROPOSAL_TOKEN_TTL_SECONDS,
  AGENT_PROPOSAL_WORKSPACE_CLAIM,
} from '../agent-proposals.constants.js';

/** What the credential names: the proposal being applied, and who approved it. */
export interface AgentProposalGrant {
  workspaceId: string;
  proposalId: string;
  approvedByUserId: string;
}

/**
 * The credential the API applies an approved proposal with (ADR 0028): a JWT naming the proposal
 * and the person who approved it, valid for two minutes and signed with a key derived from
 * `BETTER_AUTH_SECRET` for this purpose only. It never leaves the server.
 */
@Injectable()
export class AgentProposalTokenService {
  private readonly token: InternalToken;

  constructor(config: AppConfigService) {
    this.token = new InternalToken({
      secret: config.authSecret,
      keyContext: AGENT_PROPOSAL_TOKEN_KEY_CONTEXT,
      issuer: AGENT_PROPOSAL_TOKEN_ISSUER,
      audience: AGENT_PROPOSAL_TOKEN_AUDIENCE,
      ttlSeconds: AGENT_PROPOSAL_TOKEN_TTL_SECONDS,
    });
  }

  issue(grant: AgentProposalGrant): Promise<string> {
    return this.token.issue(grant.approvedByUserId, {
      [AGENT_PROPOSAL_WORKSPACE_CLAIM]: grant.workspaceId,
      [AGENT_PROPOSAL_ID_CLAIM]: grant.proposalId,
    });
  }

  /** The grant the token names, or null when it is forged, expired or malformed. */
  async verify(token: string): Promise<AgentProposalGrant | null> {
    const verified = await this.token.verify(token);
    if (!verified) return null;
    const workspaceId = verified.claims[AGENT_PROPOSAL_WORKSPACE_CLAIM];
    const proposalId = verified.claims[AGENT_PROPOSAL_ID_CLAIM];
    if (typeof workspaceId !== 'string' || typeof proposalId !== 'string') return null;
    return { workspaceId, proposalId, approvedByUserId: verified.subject };
  }
}
