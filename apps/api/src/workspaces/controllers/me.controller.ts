import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceAccessService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { MeDto } from '../dto/me.dto.js';
import { ME_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';

@ApiTags(WORKSPACES_TAG)
@ApiCookieAuth()
@Controller(ME_ROUTE)
export class MeController {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

  @Get()
  @ApiOperation({ summary: 'The signed-in user and the workspaces they belong to' })
  @ApiOkResponse({ type: MeDto })
  async getMe(@CurrentPrincipal() principal: Principal): Promise<MeDto> {
    const user = requireUser(principal);
    const workspaces = await this.workspaceAccess.listWorkspacesForUser(user.userId);
    return MeDto.from(user, workspaces);
  }
}
