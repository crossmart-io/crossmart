import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccountDeletionService, WorkspaceAccessService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { MeDto } from '../dto/me.dto.js';
import { ME_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';

@ApiTags(WORKSPACES_TAG)
@ApiCookieAuth()
@Controller(ME_ROUTE)
export class MeController {
  constructor(
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly accounts: AccountDeletionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'The signed-in user and the workspaces they belong to' })
  @ApiOkResponse({ type: MeDto })
  async getMe(@CurrentPrincipal() principal: Principal): Promise<MeDto> {
    const user = requireUser(principal);
    const workspaces = await this.workspaceAccess.listWorkspacesForUser(user.userId);
    return MeDto.from(user, workspaces);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete your account',
    description:
      'Deletes the workspaces only you use, with everything in them, and removes you from the ' +
      'others. Refused (409) while you own a workspace other people use.',
  })
  @ApiNoContentResponse()
  async deleteMe(@CurrentPrincipal() principal: Principal): Promise<void> {
    await this.accounts.delete(requireUser(principal).userId);
  }
}
