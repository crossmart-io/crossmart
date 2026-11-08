import { Injectable } from '@nestjs/common';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  AGENT_PROPOSAL_COPY,
  type AgentProposer,
  AgentProposalForbiddenError,
  AgentProposerKind,
  type AgentProposerRef,
  AgentProposalRepository,
  type ApiCredential,
  type PreviewToolRunner,
  runApiTool,
} from '@crossmart/core';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { LoopbackApi } from '../../common/loopback/loopback-api.js';
import { AUTHORIZATION_HEADER } from '../../auth/auth.constants.js';

/** The callers that propose changes: connected agents and keys (MCP sessions). */
type ProposingPrincipal = Extract<Principal, { kind: PrincipalKind.Agent | PrincipalKind.ApiKey }>;

/**
 * Who proposes, as the proposals service knows them, and how their previews read the
 * workspace: over loopback with the caller's own credential, so a preview shows only what its
 * agent may read (ADR 0028).
 */
@Injectable()
export class ProposerContext {
  constructor(
    private readonly loopback: LoopbackApi,
    private readonly proposals: AgentProposalRepository,
  ) {}

  /** The caller as a proposer ref, for reading its own proposals; 403 for anyone else. */
  refOf(principal: Principal): AgentProposerRef {
    const proposing = this.proposing(principal);
    if (proposing.kind === PrincipalKind.Agent) {
      const { workspaceId, userId, clientId } = proposing;
      const kind = AgentProposerKind.OAuthAgent;
      return { kind, workspaceId, userId, oauthClientId: clientId, apiKeyId: null };
    }
    const { workspaceId, createdById, apiKeyId } = proposing;
    const kind = AgentProposerKind.ApiKey;
    return { kind, workspaceId, userId: createdById, oauthClientId: null, apiKeyId };
  }

  async proposerOf(principal: Principal): Promise<AgentProposer> {
    const proposing = this.proposing(principal);
    const ref = this.refOf(proposing);
    if (proposing.kind === PrincipalKind.Agent) {
      const { clientName, scopes, permissions } = proposing;
      return { ...ref, agentName: clientName, scopes, permissions };
    }
    const keyName = await this.proposals.apiKeyName(ref.workspaceId, proposing.apiKeyId);
    const agentName = keyName ?? proposing.apiKeyId;
    return { ...ref, agentName, scopes: [], permissions: proposing.permissions };
  }

  /** Reads for the preview, with the credential the request came with. */
  previewRunner(request: AuthenticatedRequest, workspaceId: string): PreviewToolRunner {
    const client = this.loopback.client(this.credentialOf(request, workspaceId));
    return (spec, input) => runApiTool(spec, client, input);
  }

  private credentialOf(request: AuthenticatedRequest, workspaceId: string): ApiCredential {
    const isKey = request.principal?.kind === PrincipalKind.ApiKey;
    const header = isKey ? API_KEY_HEADER : AUTHORIZATION_HEADER;
    return { headers: { [header]: request.header(header) ?? '' }, workspaceId };
  }

  /** Only a connected agent or a key proposes, never as a proposal being applied. */
  private proposing(principal: Principal): ProposingPrincipal {
    const proposes =
      (principal.kind === PrincipalKind.Agent || principal.kind === PrincipalKind.ApiKey) &&
      !principal.approvedByUserId;
    if (!proposes) throw new AgentProposalForbiddenError(AGENT_PROPOSAL_COPY.onlyAgents);
    return principal;
  }
}
