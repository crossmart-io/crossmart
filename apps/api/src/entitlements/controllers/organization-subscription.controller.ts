import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionService, WorkspaceAccessService, WorkspacePermission } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { ORGANIZATION_ID_PARAM } from '../../workspaces/workspaces.constants.js';
import { SubscriptionDto } from '../dto/subscription.dto.js';
import { ORGANIZATION_SUBSCRIPTION_ROUTE, PLANS_TAG } from '../entitlements.constants.js';

@ApiTags(PLANS_TAG)
@ApiCookieAuth()
@Controller(ORGANIZATION_SUBSCRIPTION_ROUTE)
export class OrganizationSubscriptionController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly access: WorkspaceAccessService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'The organization’s plan, its limits and current usage',
    description:
      'For people holding `billing:view` (owners and admins) in a workspace of the ' +
      'organization; others in it get 403, and outsiders 404. Usage is counted across all ' +
      'of its workspaces. Needs a signed-in user.',
  })
  @ApiOkResponse({ type: SubscriptionDto })
  async get(
    @Param(ORGANIZATION_ID_PARAM, ParseUUIDPipe) organizationId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<SubscriptionDto> {
    const { userId } = requireUser(principal);
    await this.access.assertOrganizationPermission(
      organizationId,
      userId,
      WorkspacePermission.ViewBilling,
    );
    return SubscriptionDto.from(await this.subscriptions.overview(organizationId));
  }
}
