import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { OpenApiSecurityScheme } from '@crossmart/common';
import { ASK_ESCALATIONS_PER_DAY, AskEscalationsService } from '@crossmart/core';
import { AllowAnonymous } from '../../auth/decorators/allow-anonymous.decorator.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import {
  ASK_ESCALATION_ID_PARAM,
  ASK_ESCALATIONS_ROUTE,
  ASK_RATE_LIMITED_MESSAGE,
  ASK_TAG,
} from '../ask.constants.js';
import { AskEscalationDto, OpenedAskEscalationDto } from '../dto/ask-escalation.dto.js';
import { CreateAskEscalationDto } from '../dto/create-ask-escalation.dto.js';
import { EscalationIdPipe } from '../pipes/escalation-id.pipe.js';
import { AskPollThrottlerGuard } from '../guards/ask-poll-throttler.guard.js';
import { AskThrottlerGuard } from '../guards/ask-throttler.guard.js';
import { AskCallerResolver } from '../services/ask-caller.resolver.js';

/** An empty security requirement: the routes also take calls with no credentials. */
const ANONYMOUS_SECURITY = {};

/** Escalating a conversation with Ask Crossmart to a person, and reading the reply (ADR 0025). */
@ApiTags(ASK_TAG)
@Controller(ASK_ESCALATIONS_ROUTE)
@AllowAnonymous()
@ApiSecurity(OpenApiSecurityScheme.ApiKey)
@ApiSecurity(OpenApiSecurityScheme.SessionCookie)
@ApiSecurity(OpenApiSecurityScheme.AgentToken)
@ApiSecurity(ANONYMOUS_SECURITY)
export class AskEscalationsController {
  constructor(
    private readonly escalations: AskEscalationsService,
    private readonly callers: AskCallerResolver,
  ) {}

  @Post()
  @UseGuards(AskThrottlerGuard)
  @RateLimitMessage(ASK_RATE_LIMITED_MESSAGE)
  @ApiOperation({
    summary: 'Ask for a person',
    description:
      'Hands your conversation with Ask Crossmart to the Crossmart team, who get it by email. ' +
      'Their reply goes to `contactEmail`, is POSTed to `callbackUrl` (signed like webhooks, ' +
      'with the `callbackSecret` returned here), and can be read with ' +
      '`GET /api/v1/ask/escalations/{id}`. Only the caller who had the conversation can ' +
      `escalate it, ${ASK_ESCALATIONS_PER_DAY} times a day at most.`,
  })
  @ApiCreatedResponse({ type: OpenedAskEscalationDto })
  @ApiBadRequestResponse({ description: 'The callback URL is not a public https URL' })
  @ApiNotFoundResponse({ description: 'The conversation expired or is not yours' })
  @ApiTooManyRequestsResponse({ description: 'Too many escalations today' })
  async open(
    @Body() body: CreateAskEscalationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<OpenedAskEscalationDto> {
    const caller = await this.callers.resolve(request);
    return OpenedAskEscalationDto.fromOpened(await this.escalations.open(body, caller));
  }

  @Get(`:${ASK_ESCALATION_ID_PARAM}`)
  @UseGuards(AskPollThrottlerGuard)
  @ApiOperation({
    summary: 'Read an escalation',
    description:
      'Its status and, once the team answered, the reply. The ticket id returned when the ' +
      'escalation was opened is the only credential needed.',
  })
  @ApiOkResponse({ type: AskEscalationDto })
  @ApiNotFoundResponse({ description: 'No escalation has this id' })
  async get(
    @Param(ASK_ESCALATION_ID_PARAM, EscalationIdPipe) escalationId: string,
  ): Promise<AskEscalationDto> {
    return AskEscalationDto.from(await this.escalations.ticket(escalationId));
  }
}
