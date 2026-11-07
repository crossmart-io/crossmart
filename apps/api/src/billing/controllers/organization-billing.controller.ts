import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BillingAccountService,
  BillingCheckoutService,
  BillingStatusService,
  WorkspaceAccessService,
  WorkspacePermission,
} from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal, UserPrincipal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { ApiSandboxRestrictedResponse } from '../../entitlements/decorators/api-sandbox-restricted-response.decorator.js';
import { ORGANIZATION_ID_PARAM } from '../../workspaces/workspaces.constants.js';
import {
  BILLING_TAG,
  CHECKOUT_SESSIONS_PATH,
  ORGANIZATION_BILLING_ROUTE,
  PORTAL_SESSIONS_PATH,
} from '../billing.constants.js';
import { BillingStatusDto } from '../dto/billing-status.dto.js';
import { HostedSessionDto } from '../dto/hosted-session.dto.js';
import { StartCheckoutDto } from '../dto/start-checkout.dto.js';

const BILLING_OFF =
  'Billing is not enabled on this instance (self-hosted), or the organization is unknown.';

/**
 * An organization's billing (ADR 0024): its subscription, and the provider's hosted pages to
 * start or change it. People only; agents and API keys never reach billing.
 */
@ApiTags(BILLING_TAG)
@ApiCookieAuth()
@Controller(ORGANIZATION_BILLING_ROUTE)
export class OrganizationBillingController {
  constructor(
    private readonly status: BillingStatusService,
    private readonly checkout: BillingCheckoutService,
    private readonly accounts: BillingAccountService,
    private readonly access: WorkspaceAccessService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'The organization’s subscription and what it may do under it',
    description:
      'For people holding `billing:view` in a workspace of the organization. Includes whether ' +
      'it is read-only and why, and whether a checkout would start with a trial. Usage against ' +
      'limits is at `GET /organizations/{organizationId}/subscription`.',
  })
  @ApiOkResponse({ type: BillingStatusDto })
  async get(
    @Param(ORGANIZATION_ID_PARAM, ParseUUIDPipe) organizationId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<BillingStatusDto> {
    await this.authorize(organizationId, principal, WorkspacePermission.ViewBilling);
    return BillingStatusDto.from(await this.status.status(organizationId));
  }

  @Post(CHECKOUT_SESSIONS_PATH)
  @ApiOperation({
    summary: 'Start a subscription: a checkout page for a plan and interval',
    description:
      'For people holding `billing:manage` (owners and admins). Answers the URL of the ' +
      'provider’s checkout page. The card is collected even for the free trial, which only the ' +
      'organization’s first subscription gets, and is charged when it ends. An organization with ' +
      'a live subscription changes it in the billing portal instead (409).',
  })
  @ApiCreatedResponse({ type: HostedSessionDto })
  @ApiBadRequestResponse({ description: 'The plan is not offered, or not sold online' })
  @ApiConflictResponse({ description: 'The organization already has a live subscription' })
  @ApiNotFoundResponse({ description: BILLING_OFF })
  @ApiSandboxRestrictedResponse()
  async startCheckout(
    @Param(ORGANIZATION_ID_PARAM, ParseUUIDPipe) organizationId: string,
    @Body() body: StartCheckoutDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<HostedSessionDto> {
    const user = await this.authorize(organizationId, principal, WorkspacePermission.ManageBilling);
    const session = await this.checkout.startCheckout({
      organizationId,
      planCode: body.planCode,
      interval: body.interval,
      email: user.email,
    });
    return HostedSessionDto.from(session);
  }

  @Post(PORTAL_SESSIONS_PATH)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Open the billing portal',
    description:
      'For people holding `billing:manage`. Answers the URL of the provider’s portal, where the ' +
      'plan, interval and card are changed, the subscription canceled, and invoices downloaded.',
  })
  @ApiCreatedResponse({ type: HostedSessionDto })
  @ApiConflictResponse({ description: 'The organization has not chosen a plan yet' })
  @ApiNotFoundResponse({ description: BILLING_OFF })
  async openPortal(
    @Param(ORGANIZATION_ID_PARAM, ParseUUIDPipe) organizationId: string,
    @CurrentPrincipal() principal: Principal,
  ): Promise<HostedSessionDto> {
    await this.authorize(organizationId, principal, WorkspacePermission.ManageBilling);
    return HostedSessionDto.from(await this.accounts.openPortal(organizationId));
  }

  private async authorize(
    organizationId: string,
    principal: Principal,
    permission: WorkspacePermission,
  ): Promise<UserPrincipal> {
    const user = requireUser(principal);
    await this.access.assertOrganizationPermission(organizationId, user.userId, permission);
    return user;
  }
}
