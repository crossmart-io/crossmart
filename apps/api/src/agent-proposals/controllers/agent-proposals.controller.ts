import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AgentProposalDecisions,
  AgentProposalsService,
  type ResolvedRole,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceAccess } from '../../auth/decorators/workspace-access.decorator.js';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { requireUser } from '../../auth/principal.utils.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';
import { AgentApprovalExempt } from '../decorators/agent-approval-exempt.decorator.js';
import {
  AGENT_PROPOSALS_ROUTE,
  AGENT_PROPOSALS_TAG,
  APPROVE_PATH,
  PROPOSAL_PATH,
  PROPOSALS_VIEW_REQUIRED,
  REJECT_PATH,
  SUMMARY_PATH,
} from '../agent-proposals.constants.js';
import {
  AgentProposalDto,
  AgentProposalPageDto,
  AgentProposalSubmissionDto,
  AgentProposalSummaryDto,
} from '../dto/agent-proposal.dto.js';
import {
  AgentProposalParamsDto,
  DecideAgentProposalDto,
  ListAgentProposalsQueryDto,
  ProposeAgentChangeDto,
} from '../dto/agent-proposal-requests.dto.js';
import { ProposerContext } from '../services/proposer-context.js';

/**
 * Outside agents' changes that wait for the seller (ADR 0028). Agents and keys propose and read
 * their own proposals; signed-in people list them and approve or reject them.
 */
@ApiTags(AGENT_PROPOSALS_TAG)
@Controller(AGENT_PROPOSALS_ROUTE)
export class AgentProposalsController {
  constructor(
    private readonly proposals: AgentProposalsService,
    private readonly decisions: AgentProposalDecisions,
    private readonly proposers: ProposerContext,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @AgentApprovalExempt()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOperation({
    summary: 'Propose a change as an outside agent',
    description:
      'For connected agents and MCP sessions. Takes an MCP write tool and its input. When the ' +
      'workspace approves agents’ changes, it stores a proposal for the seller and answers ' +
      '`proposed`; otherwise it answers `apply_directly` and stores nothing. 400 for a read ' +
      'tool, an unknown one or invalid input; 403 when the caller could not make the change.',
  })
  @ApiOkResponse({ type: AgentProposalSubmissionDto })
  async propose(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: ProposeAgentChangeDto,
    @Req() request: AuthenticatedRequest,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentProposalSubmissionDto> {
    const proposer = await this.proposers.proposerOf(principal);
    const run = this.proposers.previewRunner(request, workspaceId);
    const call = { tool: body.tool, input: body.input };
    return AgentProposalSubmissionDto.from(await this.proposals.propose(proposer, call, run));
  }

  @Get()
  @RequirePermission(WorkspacePermission.ViewSuggestions)
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOperation({ summary: 'Outside agents’ proposals, newest first (signed-in people)' })
  @ApiOkResponse({ type: AgentProposalPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListAgentProposalsQueryDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentProposalPageDto> {
    requireUser(principal);
    return AgentProposalPageDto.from(await this.proposals.list(workspaceId, query.toQuery()));
  }

  @Get(SUMMARY_PATH)
  @RequirePermission(WorkspacePermission.ViewSuggestions)
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOperation({ summary: 'How many proposals wait for a decision (signed-in people)' })
  @ApiOkResponse({ type: AgentProposalSummaryDto })
  async summary(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentProposalSummaryDto> {
    requireUser(principal);
    return { pendingCount: await this.proposals.countPending(workspaceId) };
  }

  @Get(PROPOSAL_PATH)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'One proposal and where it stands',
    description:
      'People need suggestions:view. An agent or key reads only proposals it made; any other ' +
      'id answers 404.',
  })
  @ApiOkResponse({ type: AgentProposalDto })
  async get(
    @Param() { workspaceId, proposalId }: AgentProposalParamsDto,
    @CurrentPrincipal() principal: Principal,
    @CurrentWorkspaceAccess() access: ResolvedRole,
  ): Promise<AgentProposalDto> {
    if (principal.kind !== PrincipalKind.User) {
      const ref = this.proposers.refOf(principal);
      return AgentProposalDto.from(await this.proposals.getForProposer(ref, proposalId));
    }
    if (!access.permissions.has(WorkspacePermission.ViewSuggestions)) {
      throw new ForbiddenException(PROPOSALS_VIEW_REQUIRED);
    }
    return AgentProposalDto.from(await this.proposals.get(workspaceId, proposalId));
  }

  @Post(APPROVE_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ApproveSuggestions)
  @ApiOperation({
    summary: 'Approve a proposal: the change is made as the agent, approved by you',
    description:
      'Needs the permission the change itself needs too. A proposal with risks needs ' +
      '`confirmHighRisk`. 409 when it no longer waits (decided or expired).',
  })
  @ApiOkResponse({ type: AgentProposalDto })
  async approve(
    @Param() { workspaceId, proposalId }: AgentProposalParamsDto,
    @Body() body: DecideAgentProposalDto,
    @CurrentPrincipal() principal: Principal,
    @CurrentWorkspaceAccess() access: ResolvedRole,
  ): Promise<AgentProposalDto> {
    const reviewer = { userId: requireUser(principal).userId, permissions: access.permissions };
    const confirm = body.confirmHighRisk ?? false;
    const view = await this.decisions.approve(workspaceId, proposalId, reviewer, confirm);
    return AgentProposalDto.from(view);
  }

  @Post(REJECT_PATH)
  @HttpCode(HttpStatus.OK)
  @AllowedWhileReadOnly()
  @RequirePermission(WorkspacePermission.ApproveSuggestions)
  @ApiOperation({ summary: 'Reject a proposal; nothing changes and the agent reads `rejected`' })
  @ApiOkResponse({ type: AgentProposalDto })
  async reject(
    @Param() { workspaceId, proposalId }: AgentProposalParamsDto,
    @CurrentPrincipal() principal: Principal,
    @CurrentWorkspaceAccess() access: ResolvedRole,
  ): Promise<AgentProposalDto> {
    const reviewer = { userId: requireUser(principal).userId, permissions: access.permissions };
    return AgentProposalDto.from(await this.decisions.reject(workspaceId, proposalId, reviewer));
  }
}
