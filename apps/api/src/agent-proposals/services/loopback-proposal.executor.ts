import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AGENT_PROPOSAL_COPY,
  AGENT_PROPOSAL_TOKEN_HEADER,
  type AgentProposalGrant,
  AgentProposalExecutor,
  AgentProposalTokenService,
  type ApiToolResult,
  type ApiToolSpec,
  runApiTool,
} from '@crossmart/core';
import { LoopbackApi } from '../../common/loopback/loopback-api.js';

/**
 * Applies an approved proposal by calling this API over loopback with a two-minute credential
 * that names the proposal (ADR 0028). The API turns it into the proposing agent or key as it
 * stands now, credited as approved by the person, so the change meets every guard; a proposer
 * that is gone (a revoked connection or key) answers 401, which reads as such.
 */
@Injectable()
export class LoopbackProposalExecutor extends AgentProposalExecutor {
  constructor(
    private readonly loopback: LoopbackApi,
    private readonly tokens: AgentProposalTokenService,
  ) {
    super();
  }

  async execute(
    grant: AgentProposalGrant,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult> {
    const token = await this.tokens.issue(grant);
    const client = this.loopback.client({
      headers: { [AGENT_PROPOSAL_TOKEN_HEADER]: token },
      workspaceId: grant.workspaceId,
    });
    const result = await runApiTool(spec, client, input);
    return result.status === HttpStatus.UNAUTHORIZED
      ? { ...result, text: AGENT_PROPOSAL_COPY.proposerGone }
      : result;
  }
}
