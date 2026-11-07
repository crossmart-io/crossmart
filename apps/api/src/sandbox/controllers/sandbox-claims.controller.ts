import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SandboxClaimsService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { AuthService } from '../../auth/services/auth.service.js';
import {
  ClaimedSandboxDto,
  ClaimSandboxDto,
  SandboxClaimPreviewDto,
  SandboxClaimTokenDto,
} from '../dto/sandbox-claim.dto.js';
import {
  SANDBOX_CLAIM_PREVIEW_ROUTE,
  SANDBOX_CLAIMS_ROUTE,
  SANDBOX_TAG,
} from '../sandbox.constants.js';

const INVALID_LINK = 'The link is unknown, used or expired';

/** For the person who opened a sandbox account's claim link. */
@ApiTags(SANDBOX_TAG)
@Controller(SANDBOX_CLAIMS_ROUTE)
export class SandboxClaimsController {
  constructor(
    private readonly claims: SandboxClaimsService,
    private readonly auth: AuthService,
  ) {}

  @Post(SANDBOX_CLAIM_PREVIEW_ROUTE)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'What a claim link is for',
    description: 'Open to anyone with the link, so the claim page can show it before signing in.',
  })
  @ApiOkResponse({ type: SandboxClaimPreviewDto })
  @ApiNotFoundResponse({ description: INVALID_LINK })
  async preview(@Body() body: SandboxClaimTokenDto): Promise<SandboxClaimPreviewDto> {
    return SandboxClaimPreviewDto.from(await this.claims.preview(body.token));
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim a sandbox account with a new password',
    description:
      'Sets the password the person signs in with and makes the workspace a normal one. The ' +
      'link works once. Sign in with the returned email and the password afterwards. 409 when ' +
      'the person already has a password: they sign in and claim from the app instead.',
  })
  @ApiOkResponse({ type: ClaimedSandboxDto })
  @ApiNotFoundResponse({ description: INVALID_LINK })
  @ApiConflictResponse({ description: 'The account has a password already; sign in to claim it' })
  async claim(@Body() body: ClaimSandboxDto): Promise<ClaimedSandboxDto> {
    const passwordHash = await this.auth.hashPassword(body.password);
    return ClaimedSandboxDto.from(await this.claims.claimWithPassword(body.token, passwordHash));
  }
}
