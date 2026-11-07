import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowAnonymous } from '../../auth/decorators/allow-anonymous.decorator.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { ASK_RATE_LIMITED_MESSAGE } from '../../ask/ask.constants.js';
import { AskPollThrottlerGuard } from '../../ask/guards/ask-poll-throttler.guard.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import { A2A_ROUTE, A2A_VERSION_HEADER, A2A_VERSION_QUERY } from '../a2a.constants.js';
import type { JsonRpcResponse } from '../entities/a2a-protocol.js';
import { A2aQuestionThrottlerGuard } from '../guards/a2a-throttler.guard.js';
import { A2aDispatcher } from '../services/a2a-dispatcher.js';

const NO_VERSION = '';

/**
 * The A2A JSON-RPC endpoint, `POST /a2a` (ADR 0025): anonymous for questions about Crossmart,
 * and with an API key or agent token also about the caller's workspace. JSON-RPC, not REST, so
 * it is described by the Agent Card, not the OpenAPI spec.
 */
@ApiExcludeController()
@Controller({ path: A2A_ROUTE, version: VERSION_NEUTRAL })
@AllowAnonymous()
export class A2aController {
  constructor(private readonly dispatcher: A2aDispatcher) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AskPollThrottlerGuard, A2aQuestionThrottlerGuard)
  @RateLimitMessage(ASK_RATE_LIMITED_MESSAGE)
  handle(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
    @Headers(A2A_VERSION_HEADER) header?: string,
    @Query(A2A_VERSION_QUERY) query?: string,
  ): Promise<JsonRpcResponse> {
    return this.dispatcher.handle(body, request, header ?? query ?? NO_VERSION);
  }
}
