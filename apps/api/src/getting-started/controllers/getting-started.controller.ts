import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GettingStartedService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { actingUserId } from '../../auth/principal.utils.js';
import { GETTING_STARTED_ROUTE, GETTING_STARTED_TAG } from '../getting-started.constants.js';
import { GettingStartedDto } from '../dto/getting-started.dto.js';

@ApiTags(GETTING_STARTED_TAG)
@Controller(GETTING_STARTED_ROUTE)
export class GettingStartedController {
  constructor(private readonly gettingStarted: GettingStartedService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Where a new account stands, and what to do next',
    description:
      'Counts of products, stores and live listings, whether the email is confirmed, and the ' +
      'steps to a first listing: each says whether it is done, whether the seller (in the app, ' +
      'with a link) or an agent (with the tools named) takes it. For agents that connect to an ' +
      'empty workspace.',
  })
  @ApiOkResponse({ type: GettingStartedDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<GettingStartedDto> {
    const view = await this.gettingStarted.read(workspaceId, actingUserId(principal));
    return GettingStartedDto.from(view);
  }
}
