import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { SANDBOX_MAX_PRODUCTS, SANDBOX_TTL_DAYS, SandboxAccountsService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import { CreateSandboxAccountDto } from '../dto/create-sandbox-account.dto.js';
import { SandboxAccountDto } from '../dto/sandbox-account.dto.js';
import { SandboxThrottlerGuard } from '../guards/sandbox-throttler.guard.js';
import {
  SANDBOX_ACCOUNTS_PER_DAY,
  SANDBOX_ACCOUNTS_PER_HOUR,
  SANDBOX_ACCOUNTS_ROUTE,
  SANDBOX_RATE_LIMITED_MESSAGE,
  SANDBOX_TAG,
} from '../sandbox.constants.js';

/** AI agents open accounts for people who have none yet (ADR 0019). */
@ApiTags(SANDBOX_TAG)
@Controller(SANDBOX_ACCOUNTS_ROUTE)
export class SandboxAccountsController {
  constructor(private readonly sandboxes: SandboxAccountsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(SandboxThrottlerGuard)
  @RateLimitMessage(SANDBOX_RATE_LIMITED_MESSAGE)
  @ApiOperation({
    summary: 'Open a sandbox account for someone without one',
    description:
      'For AI agents: no credentials needed. Opens an account for `email` with a workspace ' +
      'named `storeName`, returns an Editor API key for it, and emails the person a link to ' +
      'claim it. Until claimed it is a sandbox: products (at most ' +
      `${SANDBOX_MAX_PRODUCTS}), stock and drafts work, but connecting stores, publishing, ` +
      'inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed ' +
      `accounts are deleted after ${SANDBOX_TTL_DAYS} days. When the address already has an ` +
      'account, nothing is created and no email is sent, and the answer is the same whoever ' +
      `owns it: \`sign_in_required\`. At most ${SANDBOX_ACCOUNTS_PER_HOUR} calls an hour and ` +
      `${SANDBOX_ACCOUNTS_PER_DAY} a day per caller address; 429 past those.`,
  })
  @ApiOkResponse({ type: SandboxAccountDto })
  @ApiTooManyRequestsResponse({ description: SANDBOX_RATE_LIMITED_MESSAGE })
  async create(@Body() body: CreateSandboxAccountDto): Promise<SandboxAccountDto> {
    return SandboxAccountDto.from(await this.sandboxes.open(body));
  }
}
