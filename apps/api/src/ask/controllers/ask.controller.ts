import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { OpenApiSecurityScheme } from '@crossmart/common';
import { AskService } from '@crossmart/core';
import { AllowAnonymous } from '../../auth/decorators/allow-anonymous.decorator.js';
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

/** An empty security requirement: the route also takes calls with no credentials. */
const ANONYMOUS_SECURITY = {};

/** Ask Crossmart: grounded answers about Crossmart, for sellers and AI agents (ADR 0022). */
@ApiTags(ASK_TAG)
@Controller(ASK_ROUTE)
export class AskController {
  constructor(private readonly askService: AskService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @UseGuards(AskThrottlerGuard)
  @RateLimitMessage(ASK_RATE_LIMITED_MESSAGE)
  @ApiSecurity(OpenApiSecurityScheme.ApiKey)
  @ApiSecurity(OpenApiSecurityScheme.SessionCookie)
  @ApiSecurity(ANONYMOUS_SECURITY)
  @ApiOperation({
    summary: 'Ask a question about Crossmart',
    description:
      'Answers from Crossmart’s public documentation and plan lineup only, citing the pages ' +
      'it used. When they do not answer the question, `outcome` is `unknown` and the answer ' +
      'points to the support address. It never sees or changes any account or workspace data. ' +
      `No credentials are needed: anonymous callers may ask ${ASK_ANONYMOUS_PER_MINUTE} ` +
      `questions a minute and ${ASK_ANONYMOUS_PER_DAY} a day per IP address; with an API key ` +
      `or session, ${ASK_AUTHENTICATED_PER_MINUTE} a minute and ${ASK_AUTHENTICATED_PER_DAY} ` +
      'a day. Answers 429 past those, and 503 when AI is not configured or the platform’s ' +
      'daily question budget is spent.',
  })
  @ApiOkResponse({ type: AskAnswerDto })
  @ApiTooManyRequestsResponse({ description: ASK_RATE_LIMITED_MESSAGE })
  @ApiServiceUnavailableResponse({
    description: 'AI is not configured, Ask is turned off, or today’s questions are spent',
  })
  async ask(@Body() body: AskQuestionDto): Promise<AskAnswerDto> {
    return AskAnswerDto.from(await this.askService.ask(body.question));
  }
}
