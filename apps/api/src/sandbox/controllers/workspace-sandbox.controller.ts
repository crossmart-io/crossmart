import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SandboxClaimsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { ClaimedSandboxDto } from '../dto/sandbox-claim.dto.js';
import { SANDBOX_TAG, WORKSPACE_SANDBOX_CLAIM_ROUTE } from '../sandbox.constants.js';

/** The signed-in owner of a sandbox account claims it from the app. */
@ApiTags(SANDBOX_TAG)
@ApiCookieAuth()
@Controller(WORKSPACE_SANDBOX_CLAIM_ROUTE)
export class WorkspaceSandboxController {
  constructor(private readonly claims: SandboxClaimsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Claim this sandbox account as its owner',
    description:
      'For the person the sandbox was opened for, signed in (a password reset link is the only ' +
      'other way in, and it proves the address too). Makes the workspace a normal one. API ' +
      'keys and agents get 403; anyone else, or a workspace with nothing to claim, 404.',
  })
  @ApiOkResponse({ type: ClaimedSandboxDto })
  @ApiNotFoundResponse({ description: 'Nothing here for you to claim' })
  async claim(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<ClaimedSandboxDto> {
    const { userId } = requireUser(principal);
    return ClaimedSandboxDto.from(await this.claims.claimAsOwner(workspaceId, userId));
  }
}
