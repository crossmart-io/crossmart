import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ApiToolResult } from '../../agent-tools/tools/api-tool.js';
import { truncateWithNote } from '../../agent-worker/rules/truncate-text.js';
import {
  AGENT_PROPOSAL_COPY,
  AGENT_PROPOSAL_RESULT_MAX_LENGTH,
} from '../agent-proposals.constants.js';
import type { AgentProposalReviewer } from '../entities/agent-proposer.js';
import type { AgentProposalView } from '../entities/agent-proposal-views.js';
import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import {
  AgentProposalForbiddenError,
  AgentProposalNotFoundError,
  AgentProposalNotPendingError,
  AgentProposalRiskNotConfirmedError,
} from '../errors/agent-proposal.errors.js';
import { effectiveStatus, toProposalView } from '../mappers/agent-proposal.mapper.js';
import type { AgentProposalRecord } from '../repositories/agent-proposal.queries.js';
import { AgentProposalRepository } from '../repositories/agent-proposal.repository.js';
import { permitsTool, proposableTool, proposalToolTitle } from '../rules/proposal-tools.js';
import { AgentProposalExecutor } from './agent-proposal-executor.js';

/** Who did what, as the agent proposed it, for the reject event. */
const REJECTED_DETAIL = (agentName: string): string => `from ${agentName}`;

/**
 * A person's decision on an outside agent's proposal (ADR 0028). Approving claims it with a
 * conditional update, so it runs once however many people approve, then applies it through the
 * API as the agent, credited as approved by the person. A refusal is recorded, never hidden.
 */
@Injectable()
export class AgentProposalDecisions {
  private readonly logger = new Logger(AgentProposalDecisions.name);

  constructor(
    private readonly proposals: AgentProposalRepository,
    private readonly executor: AgentProposalExecutor,
    private readonly activity: ActivityRecorder,
  ) {}

  async approve(
    workspaceId: string,
    proposalId: string,
    reviewer: AgentProposalReviewer,
    confirmHighRisk: boolean,
  ): Promise<AgentProposalView> {
    const record = await this.pending(workspaceId, proposalId);
    const spec = proposableTool(record.toolName);
    if (!permitsTool(spec, reviewer.permissions)) {
      throw new AgentProposalForbiddenError(AGENT_PROPOSAL_COPY.reviewerLacksPermission);
    }
    if (record.risks.length > 0 && !confirmHighRisk) throw new AgentProposalRiskNotConfirmedError();
    await this.claim(record, AgentProposalStatus.Applying, reviewer.userId);
    const grant = { workspaceId, proposalId, approvedByUserId: reviewer.userId };
    const result = await this.apply(() =>
      this.executor.execute(grant, spec, record.input as Record<string, unknown>),
    );
    await this.proposals.finish(proposalId, {
      status: result.isError ? AgentProposalStatus.Failed : AgentProposalStatus.Applied,
      result: truncateWithNote(result.text, AGENT_PROPOSAL_RESULT_MAX_LENGTH),
      resultIsError: result.isError,
    });
    return this.view(workspaceId, proposalId);
  }

  async reject(
    workspaceId: string,
    proposalId: string,
    reviewer: AgentProposalReviewer,
  ): Promise<AgentProposalView> {
    const record = await this.pending(workspaceId, proposalId);
    await this.claim(record, AgentProposalStatus.Rejected, reviewer.userId);
    await this.activity.record(workspaceId, Actor.user(reviewer.userId), {
      action: ActivityAction.AgentProposalRejected,
      subject: { type: ActivitySubjectType.AgentProposal, id: record.id, label: record.summary },
      detail: REJECTED_DETAIL(record.agentName),
    });
    return this.view(workspaceId, proposalId);
  }

  private async pending(workspaceId: string, proposalId: string): Promise<AgentProposalRecord> {
    const record = await this.proposals.find(workspaceId, proposalId);
    if (!record) throw new AgentProposalNotFoundError();
    if (effectiveStatus(record, new Date()) !== AgentProposalStatus.Pending) {
      throw new AgentProposalNotPendingError();
    }
    return record;
  }

  private async claim(
    record: AgentProposalRecord,
    status: AgentProposalStatus,
    userId: string,
  ): Promise<void> {
    const decision = { userId, now: new Date() };
    const won = await this.proposals.decide(record.workspaceId, record.id, status, decision);
    if (!won) throw new AgentProposalNotPendingError();
  }

  /** An unreachable API is a failed change, not a failed request. */
  private async apply(run: () => Promise<ApiToolResult>): Promise<ApiToolResult> {
    try {
      return await run();
    } catch (error) {
      this.logger.warn(`Could not apply an agent proposal: ${describeError(error)}`);
      return { isError: true, text: AGENT_PROPOSAL_COPY.unreachable };
    }
  }

  private async view(workspaceId: string, proposalId: string): Promise<AgentProposalView> {
    const record = await this.proposals.find(workspaceId, proposalId);
    if (!record) throw new AgentProposalNotFoundError();
    return toProposalView(record, proposalToolTitle, new Date());
  }
}
