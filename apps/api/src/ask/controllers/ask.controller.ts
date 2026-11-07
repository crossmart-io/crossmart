import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiServiceUnavailableResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { OpenApiSecurityScheme } from '@crossmart/common';
import { AskChannel, AskService } from '@crossmart/core';
import { AllowAnonymous } from '../../auth/decorators/allow-anonymous.decorator.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import {
  ASK_ANONYMOUS_PER_DAY,
  ASK_ANONYMOUS_PER_MINUTE,
  ASK_AUTHENTICATED_PER_DAY,
  ASK_AUTHENTICATED_PER_MINUTE,
  ASK_RATE_LIMITED_MESSAGE,
  ASK_ROUTE,
  ASK_TAG,
} from '../ask.constants.js';
import { AskAnswerDto } from '../dto/ask-answer.dto.js';
import { AskQuestionDto } from '../dto/ask-question.dto.js';
import { AskThrottlerGuard } from '../guards/ask-throttler.guard.js';
import { AskCallerResolver } from '../services/ask-caller.resolver.js';

/** An empty security requirement: the route also takes calls with no credentials. */
const ANONYMOUS_SECURITY = {};

/** Ask Crossmart: grounded answers about Crossmart, for sellers and AI agents (ADR 0022). */
@ApiTags(ASK_TAG)
@Controller(ASK_ROUTE)
export class AskController {
  constructor(
    private readonly askService: AskService,
    private readonly callers: AskCallerResolver,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @UseGuards(AskThrottlerGuard)
  @RateLimitMessage(ASK_RATE_LIMITED_MESSAGE)
  @ApiSecurity(OpenApiSecurityScheme.ApiKey)
  @ApiSecurity(OpenApiSecurityScheme.SessionCookie)
  @ApiSecurity(OpenApiSecurityScheme.AgentToken)
  @ApiSecurity(ANONYMOUS_SECURITY)
  @ApiOperation({
    summary: 'Ask a question about Crossmart',
    description:
      'Answers from Crossmart’s public documentation and plan lineup, citing the pages it ' +
      'used. When they do not answer the question, `outcome` is `unknown` and the answer ' +
      'points to the support address. Send the returned `conversationId` with a follow-up ' +
      'question to continue the conversation. With an API key, an agent token, or a session ' +
      'and a `workspaceId`, it can also look up that workspace (listings, plan and usage, ' +
      'stores) to answer, read-only and within the caller’s permissions; it never changes ' +
      'anything. When a person can help, `escalation.offered` is true (see ' +
      '`POST /api/v1/ask/escalations`). Questions and answers are stored, with secrets ' +
      'redacted, for 180 days. ' +
      `No credentials are needed: anonymous callers may ask ${ASK_ANONYMOUS_PER_MINUTE} ` +
      `questions a minute and ${ASK_ANONYMOUS_PER_DAY} a day per IP address; with an API key, ` +
      `session or agent token, ${ASK_AUTHENTICATED_PER_MINUTE} a minute and ${ASK_AUTHENTICATED_PER_DAY} ` +
      'a day. Answers 429 past those, and 503 when AI is not configured or the platform’s ' +
      'daily question budget is spent.',
  })
  @ApiOkResponse({ type: AskAnswerDto })
  @ApiNotFoundResponse({
    description: 'The conversation expired or is not yours, or the workspace is not yours',
  })
  @ApiTooManyRequestsResponse({ description: ASK_RATE_LIMITED_MESSAGE })
  @ApiServiceUnavailableResponse({
    description: 'AI is not configured, Ask is turned off, or today’s questions are spent',
  })
  async ask(
    @Body() body: AskQuestionDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AskAnswerDto> {
    const caller = await this.callers.resolve(request, body.workspaceId);
    const reply = await this.askService.ask({
      question: body.question,
      conversationId: body.conversationId,
      channel: body.channel ?? AskChannel.Api,
      caller,
    });
    return AskAnswerDto.from(reply);
  }
}
