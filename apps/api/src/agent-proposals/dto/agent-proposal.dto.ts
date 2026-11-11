import { ApiProperty } from '@nestjs/swagger';
import {
  AgentApprovalExemption,
  AgentProposalOutcome,
  type AgentProposalPage,
  AgentProposalStatus,
  type AgentProposalSubmission,
  type AgentProposalView,
  AgentProposerKind,
  AgentWorkerActionRisk,
} from '@crossmart/core';
import { AGENT_WORKER_ACTION_RISK_SCHEMA_NAME } from '../../agent-worker/agent-worker.constants.js';
import {
  AgentWorkerActionPreviewDto,
  AgentWorkerActionTargetsDto,
} from '../../agent-worker/dto/agent-worker-message.dto.js';
import {
  AGENT_APPROVAL_EXEMPTION_SCHEMA_NAME,
  AGENT_PROPOSAL_OUTCOME_SCHEMA_NAME,
  AGENT_PROPOSAL_STATUS_SCHEMA_NAME,
  AGENT_PROPOSER_KIND_SCHEMA_NAME,
} from '../agent-proposals.constants.js';

/** An outside agent's proposed change (ADR 0028). */
export class AgentProposalDto implements AgentProposalView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'update_variant_price', description: 'The MCP tool it calls' })
  toolName: string;

  @ApiProperty({ example: "Change a variant's price" })
  toolTitle: string;

  @ApiProperty({
    enum: AgentProposalStatus,
    enumName: AGENT_PROPOSAL_STATUS_SCHEMA_NAME,
    description: 'A pending proposal past its expiry reads as expired',
  })
  status: AgentProposalStatus;

  @ApiProperty({ enum: AgentProposerKind, enumName: AGENT_PROPOSER_KIND_SCHEMA_NAME })
  proposerKind: AgentProposerKind;

  @ApiProperty({
    example: 'Claude',
    description: "The agent; for an MCP session with a key, the key's name",
  })
  agentName: string;

  @ApiProperty({ type: String, nullable: true, description: 'The person the agent acts for' })
  onBehalfOfName: string | null;

  @ApiProperty({ example: "Change a variant's price: Linen Shirt" })
  summary: string;

  @ApiProperty({
    enum: AgentWorkerActionRisk,
    enumName: AGENT_WORKER_ACTION_RISK_SCHEMA_NAME,
    isArray: true,
    description: 'Why approving it also needs `confirmHighRisk`; empty for ordinary changes',
  })
  risks: AgentWorkerActionRisk[];

  @ApiProperty({ type: AgentWorkerActionPreviewDto, nullable: true })
  preview: AgentWorkerActionPreviewDto | null;

  @ApiProperty({ type: AgentWorkerActionTargetsDto })
  targets: AgentWorkerActionTargetsDto;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "The API's answer once applied, or why it was refused",
  })
  result: string | null;

  @ApiProperty({ description: 'True when the approved change was refused' })
  isError: boolean;

  @ApiProperty({ type: String, nullable: true })
  decidedByName: string | null;

  @ApiProperty({ type: Date, nullable: true })
  decidedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ description: 'When it expires if nobody decides' })
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  static from(view: AgentProposalView): AgentProposalDto {
    return Object.assign(new AgentProposalDto(), view);
  }
}

export class AgentProposalPageDto implements AgentProposalPage {
  @ApiProperty({ type: [AgentProposalDto], description: 'Newest first' })
  items: AgentProposalDto[];

  @ApiProperty()
  total: number;

  static from(page: AgentProposalPage): AgentProposalPageDto {
    return Object.assign(new AgentProposalPageDto(), {
      items: page.items.map((item) => AgentProposalDto.from(item)),
      total: page.total,
    });
  }
}

/** What became of a call sent to be proposed. */
export class AgentProposalSubmissionDto implements AgentProposalSubmission {
  @ApiProperty({
    enum: AgentProposalOutcome,
    enumName: AGENT_PROPOSAL_OUTCOME_SCHEMA_NAME,
    description:
      '`proposed`: it waits for the seller. `apply_directly`: make the call itself, because ' +
      'the workspace lets agents make changes at once or the call needs no approval ' +
      '(`exemption`).',
  })
  outcome: AgentProposalOutcome;

  @ApiProperty({ description: 'What to do next, or to tell the user' })
  message: string;

  @ApiProperty({ type: AgentProposalDto, nullable: true })
  proposal: AgentProposalDto | null;

  @ApiProperty({
    enum: AgentApprovalExemption,
    enumName: AGENT_APPROVAL_EXEMPTION_SCHEMA_NAME,
    nullable: true,
    description:
      'Set with `apply_directly` when the workspace approves agents’ changes but this call ' +
      'needs none: `new_draft` for `create_product` with no status or DRAFT. Null otherwise.',
  })
  exemption: AgentApprovalExemption | null;

  static from(submission: AgentProposalSubmission): AgentProposalSubmissionDto {
    return Object.assign(new AgentProposalSubmissionDto(), {
      ...submission,
      proposal: submission.proposal ? AgentProposalDto.from(submission.proposal) : null,
    });
  }
}

export class AgentProposalSummaryDto {
  @ApiProperty({ description: 'Proposals waiting for a decision now' })
  pendingCount: number;
}
