import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionAccessPolicy, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { BILLING_TAG, WORKSPACE_BILLING_ACCESS_ROUTE } from '../billing.constants.js';
import { SubscriptionAccessDto } from '../dto/subscription-access.dto.js';

/**
 * Whether the workspace's organization may change anything, for every member and agent: the
 * banner a read-only or trialing organization shows, and a check before writing.
 */
@ApiTags(BILLING_TAG)
@Controller(WORKSPACE_BILLING_ACCESS_ROUTE)
export class WorkspaceBillingAccessController {
  constructor(private readonly subscriptionAccess: SubscriptionAccessPolicy) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Whether the workspace can be changed under its organization’s subscription',
    description:
      'For anyone in the workspace, including API keys and agents. While `writable` is false ' +
      'and `enforced` is true, changes answer 402 `subscription_inactive`: ask a billing admin ' +
      'of the organization (owners and admins) to fix the subscription.',
  })
  @ApiOkResponse({ type: SubscriptionAccessDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<SubscriptionAccessDto> {
    const access = await this.subscriptionAccess.accessInWorkspace(workspaceId);
    return SubscriptionAccessDto.from(access, this.subscriptionAccess.enforced);
  }
}
