import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  type AgentWorkerOwner,
  type AgentWorkerPreparedTurn,
  AgentWorkerConversationsService,
  AgentWorkerTurnRunner,
  AgentWorkerTurnStarter,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';
import { ServerSentEvents } from '../../common/sse/server-sent-events.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import { WorkspaceThrottlerGuard } from '../../common/throttling/workspace-throttler.guard.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';
import { ApiSandboxRestrictedResponse } from '../../entitlements/decorators/api-sandbox-restricted-response.decorator.js';
import {
  AGENT_WORKER_RATE_LIMITED_MESSAGE,
  AGENT_WORKER_ROUTE,
  AGENT_WORKER_TAG,
  AGENT_WORKER_THROTTLE_WINDOW_MS,
  AGENT_WORKER_TURNS_PER_WINDOW,
  CANCEL_PATH,
  CONVERSATION_PATH,
  DECISION_PATH,
  EVENT_STREAM_CONTENT_TYPE,
  MESSAGES_PATH,
  TURN_STREAM_DESCRIPTION,
} from '../agent-worker.constants.js';
import {
  AgentWorkerConversationDto,
  AgentWorkerConversationPageDto,
  CreateAgentWorkerConversationDto,
  ListAgentWorkerConversationsQueryDto,
} from '../dto/agent-worker-conversation.dto.js';
import { AgentWorkerConversationDetailDto } from '../dto/agent-worker-message.dto.js';
import {
  AgentWorkerCancelResultDto,
  DecideAgentWorkerActionsDto,
  SendAgentWorkerMessageDto,
} from '../dto/agent-worker-requests.dto.js';
import { AgentWorkerConversationParamsDto } from '../dto/agent-worker-params.dto.js';
import { AgentWorkerStreamEventDto } from '../dto/agent-worker-stream-event.dto.js';

const TURN_STREAM_RESPONSE = {
  description: TURN_STREAM_DESCRIPTION,
  content: {
    [EVENT_STREAM_CONTENT_TYPE]: { schema: { $ref: getSchemaPath(AgentWorkerStreamEventDto) } },
  },
};

/**
 * Agent Worker (ADR 0026): a person's conversations with the agent that operates Crossmart for
 * them. Reads run at once; changes wait for the person's approval. Only the signed-in person
 * reaches their own conversations; API keys and agents cannot use it.
 */
@ApiTags(AGENT_WORKER_TAG)
@ApiExtraModels(AgentWorkerStreamEventDto)
@RateLimitMessage(AGENT_WORKER_RATE_LIMITED_MESSAGE)
@RequirePermission(WorkspacePermission.UseAgentWorker)
@Controller(AGENT_WORKER_ROUTE)
export class AgentWorkerController {
  constructor(
    private readonly conversations: AgentWorkerConversationsService,
    private readonly starter: AgentWorkerTurnStarter,
    private readonly runner: AgentWorkerTurnRunner,
  ) {}

  @Get()
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOperation({ summary: 'Your Agent Worker conversations, most recently active first' })
  @ApiOkResponse({ type: AgentWorkerConversationPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListAgentWorkerConversationsQueryDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentWorkerConversationPageDto> {
    const page = await this.conversations.list(
      this.ownerOf(principal, workspaceId),
      query.toQuery(),
    );
    return AgentWorkerConversationPageDto.from(page);
  }

  @Post()
  @AllowedWhileReadOnly()
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOperation({ summary: 'Start a conversation with Agent Worker' })
  @ApiCreatedResponse({ type: AgentWorkerConversationDto })
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateAgentWorkerConversationDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentWorkerConversationDto> {
    const owner = this.ownerOf(principal, workspaceId);
    return AgentWorkerConversationDto.from(await this.conversations.create(owner, body.title));
  }

  @Get(CONVERSATION_PATH)
  @ApiOperation({
    summary: 'A conversation with its messages, tool calls and proposed changes',
    description: 'Answers 404 for an unknown id and for anyone else’s conversation.',
  })
  @ApiOkResponse({ type: AgentWorkerConversationDetailDto })
  async get(
    @Param() { workspaceId, conversationId }: AgentWorkerConversationParamsDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentWorkerConversationDetailDto> {
    const detail = await this.conversations.get(
      this.ownerOf(principal, workspaceId),
      conversationId,
    );
    return AgentWorkerConversationDetailDto.from(detail);
  }

  @Delete(CONVERSATION_PATH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowedWhileReadOnly()
  @ApiOperation({ summary: 'Delete a conversation, with its messages and proposed changes' })
  @ApiNoContentResponse()
  async delete(
    @Param() { workspaceId, conversationId }: AgentWorkerConversationParamsDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<void> {
    await this.conversations.delete(this.ownerOf(principal, workspaceId), conversationId);
  }

  @Post(MESSAGES_PATH)
  @AllowedWhileReadOnly()
  @UseGuards(WorkspaceThrottlerGuard)
  @Throttle({
    default: { limit: AGENT_WORKER_TURNS_PER_WINDOW, ttl: AGENT_WORKER_THROTTLE_WINDOW_MS },
  })
  @ApiOperation({
    summary: 'Send a message and stream Agent Worker’s turn',
    description:
      'Agent Worker reads what it needs right away and proposes changes, which wait for ' +
      '`POST …/decision`. Changes still waiting are dropped (expired) by a new message. Each ' +
      'model call uses one AI credit: answers 402 when the plan has none left (while plans are ' +
      'enforced), 403 in an unclaimed sandbox, 409 while a turn runs, 429 past the rate limit, ' +
      'and 503 while AI is not configured. A read-only subscription still allows reading; ' +
      'Agent Worker then proposes no changes.',
  })
  @ApiProduces(EVENT_STREAM_CONTENT_TYPE)
  @ApiOkResponse(TURN_STREAM_RESPONSE)
  @ApiPlanLimitResponse()
  @ApiSandboxRestrictedResponse()
  @ApiTooManyRequestsResponse({ description: AGENT_WORKER_RATE_LIMITED_MESSAGE })
  async sendMessage(
    @Param() { workspaceId, conversationId }: AgentWorkerConversationParamsDto,
    @Body() body: SendAgentWorkerMessageDto,
    @CurrentPrincipal() principal: Principal,
    @Res() response: Response,
  ): Promise<void> {
    const prepared = await this.starter.startMessage({
      owner: this.ownerOf(principal, workspaceId),
      conversationId,
      text: body.text,
      context: body.context,
    });
    await this.streamTurn(prepared, response);
  }

  @Post(DECISION_PATH)
  @AllowedWhileReadOnly()
  @UseGuards(WorkspaceThrottlerGuard)
  @Throttle({
    default: { limit: AGENT_WORKER_TURNS_PER_WINDOW, ttl: AGENT_WORKER_THROTTLE_WINDOW_MS },
  })
  @ApiOperation({
    summary: 'Approve or reject the changes waiting in a conversation, and stream the result',
    description:
      'Approves the listed actions and rejects every other waiting one, in one step. Approved ' +
      'changes are made through the API as "Agent Worker on behalf of" you, then Agent Worker ' +
      'goes on with their results. Actions with `risks` (deletions, price changes, bulk changes) ' +
      'also need `confirmHighRisk`: 400 without it. 409 when nothing waits or a turn runs.',
  })
  @ApiProduces(EVENT_STREAM_CONTENT_TYPE)
  @ApiOkResponse(TURN_STREAM_RESPONSE)
  @ApiTooManyRequestsResponse({ description: AGENT_WORKER_RATE_LIMITED_MESSAGE })
  async decide(
    @Param() { workspaceId, conversationId }: AgentWorkerConversationParamsDto,
    @Body() body: DecideAgentWorkerActionsDto,
    @CurrentPrincipal() principal: Principal,
    @Res() response: Response,
  ): Promise<void> {
    const prepared = await this.starter.startDecision({
      owner: this.ownerOf(principal, workspaceId),
      conversationId,
      approvedActionIds: body.approvedActionIds,
      confirmHighRisk: body.confirmHighRisk ?? false,
    });
    await this.streamTurn(prepared, response);
  }

  @Post(CANCEL_PATH)
  @HttpCode(HttpStatus.OK)
  @AllowedWhileReadOnly()
  @ApiOperation({
    summary: 'Stop the running turn',
    description: 'The model call is aborted; what already ran stays, and nothing more runs.',
  })
  @ApiOkResponse({ type: AgentWorkerCancelResultDto })
  async cancel(
    @Param() { workspaceId, conversationId }: AgentWorkerConversationParamsDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentWorkerCancelResultDto> {
    const cancelled = await this.runner.cancel(
      this.ownerOf(principal, workspaceId),
      conversationId,
    );
    return { cancelled };
  }

  /** Conversations belong to a signed-in person; API keys and agents are refused. */
  private ownerOf(principal: Principal, workspaceId: string): AgentWorkerOwner {
    return { workspaceId, userId: requireUser(principal).userId };
  }

  /** Streams a started turn; a client that leaves stops it. */
  private async streamTurn(prepared: AgentWorkerPreparedTurn, response: Response): Promise<void> {
    const events = new ServerSentEvents(response);
    events.open();
    events.onClose(() => this.runner.abandon(prepared.turn.id));
    try {
      await this.runner.stream(prepared, {
        emit: (event) => events.send(event.type, AgentWorkerStreamEventDto.from(event)),
      });
    } finally {
      events.close();
    }
  }
}
