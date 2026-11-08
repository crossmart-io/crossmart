import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { PROPOSAL_COPY } from '../../agent-tools/agent-tools.constants.js';
import type { PreviewToolRunner } from '../../agent-worker/previews/preview-reader.js';
import { ToolCallPreviewer } from '../../agent-worker/previews/tool-call-previewer.js';
import { assessRisks } from '../../agent-worker/rules/action-risk.js';
import { OutsideAgentChanges } from '../../workspace-settings/enums/outside-agent-changes.enum.js';
import { WorkspaceSettingsRepository } from '../../workspace-settings/workspace-settings.repository.js';
import { AGENT_PROPOSAL_COPY, AGENT_PROPOSAL_TTL_MS } from '../agent-proposals.constants.js';
import type {
  AgentProposer,
  AgentProposalRequest,
  AgentProposerRef,
} from '../entities/agent-proposer.js';
import type {
  AgentProposalListQuery,
  AgentProposalPage,
  AgentProposalSubmission,
  AgentProposalView,
} from '../entities/agent-proposal-views.js';
import { AgentProposalOutcome } from '../enums/agent-proposal-outcome.enum.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import {
  AgentProposalForbiddenError,
  AgentProposalNotFoundError,
} from '../errors/agent-proposal.errors.js';
import { toProposalView } from '../mappers/agent-proposal.mapper.js';
import { AgentProposalRepository } from '../repositories/agent-proposal.repository.js';
import {
  parseProposalInput,
  permitsTool,
  proposableTool,
  proposalToolTitle,
} from '../rules/proposal-tools.js';

/** What a new proposal says, before it is stored. */
interface PreparedProposal {
  spec: ApiToolSpec;
  input: Record<string, unknown>;
}

/**
 * Outside agents' changes when the workspace wants to approve them (ADR 0028): a write tool call
 * is checked like any call (the tool, its input, the caller's permissions), previewed with
 * Crossmart Agent's formatters as its agent, and stored to wait for the seller. When the
 * workspace lets agents apply directly, nothing is stored and the agent makes the call itself.
 */
@Injectable()
export class AgentProposalsService {
  private readonly previewer = new ToolCallPreviewer();

  constructor(
    private readonly proposals: AgentProposalRepository,
    private readonly settings: WorkspaceSettingsRepository,
  ) {}

  async propose(
    proposer: AgentProposer,
    request: AgentProposalRequest,
    run: PreviewToolRunner,
  ): Promise<AgentProposalSubmission> {
    const prepared = this.prepare(proposer, request);
    const policy = await this.settings.outsideAgentChanges(proposer.workspaceId);
    if (policy === OutsideAgentChanges.ApplyDirectly) {
      const message = AGENT_PROPOSAL_COPY.applyDirectly;
      return { outcome: AgentProposalOutcome.ApplyDirectly, message, proposal: null };
    }
    const view = await this.store(proposer, prepared, run);
    return {
      outcome: AgentProposalOutcome.Proposed,
      message: PROPOSAL_COPY.proposed,
      proposal: view,
    };
  }

  async list(workspaceId: string, query: AgentProposalListQuery): Promise<AgentProposalPage> {
    const now = new Date();
    const { records, total } = await this.proposals.list(workspaceId, query, now);
    return {
      items: records.map((record) => toProposalView(record, proposalToolTitle, now)),
      total,
    };
  }

  async get(workspaceId: string, id: string): Promise<AgentProposalView> {
    const record = await this.proposals.find(workspaceId, id);
    if (!record) throw new AgentProposalNotFoundError();
    return toProposalView(record, proposalToolTitle, new Date());
  }

  /** A proposal as its own agent reads it; any other proposal is not found. */
  async getForProposer(proposer: AgentProposerRef, id: string): Promise<AgentProposalView> {
    const record = await this.proposals.findForProposer(proposer, id);
    if (!record) throw new AgentProposalNotFoundError();
    return toProposalView(record, proposalToolTitle, new Date());
  }

  countPending(workspaceId: string): Promise<number> {
    return this.proposals.countPending(workspaceId, new Date());
  }

  /** The tool, its validated input, and a 403 when the caller could not make the change. */
  private prepare(proposer: AgentProposer, request: AgentProposalRequest): PreparedProposal {
    const spec = proposableTool(request.tool);
    const input = parseProposalInput(spec, request.input);
    if (!permitsTool(spec, proposer.permissions)) {
      throw new AgentProposalForbiddenError(AGENT_PROPOSAL_COPY.outOfScope(spec.name));
    }
    return { spec, input };
  }

  private async store(
    proposer: AgentProposer,
    { spec, input }: PreparedProposal,
    run: PreviewToolRunner,
  ): Promise<AgentProposalView> {
    const preview = await this.previewer.preview(spec, input, run);
    const record = await this.proposals.create({
      workspaceId: proposer.workspaceId,
      proposerKind: proposer.kind,
      userId: proposer.userId,
      oauthClientId: proposer.oauthClientId,
      apiKeyId: proposer.apiKeyId,
      agentName: proposer.agentName,
      scopes: [...proposer.scopes],
      toolName: spec.name,
      input: input as Prisma.InputJsonObject,
      risks: assessRisks({ spec, input, publishesInBatch: 1, preview }),
      summary: preview.target ? `${spec.title}: ${preview.target}` : spec.title,
      preview: preview as unknown as Prisma.InputJsonObject,
      status: AgentProposalStatus.Pending,
      expiresAt: new Date(Date.now() + AGENT_PROPOSAL_TTL_MS),
    });
    return toProposalView(record, proposalToolTitle, new Date());
  }
}
