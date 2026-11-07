import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type Actor, WebhookEndpointsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';
import {
  CreateWebhookEndpointDto,
  UpdateWebhookEndpointDto,
} from '../dto/webhook-endpoint-input.dto.js';
import { WebhookEndpointDto, WebhookEndpointWithSecretDto } from '../dto/webhook-endpoint.dto.js';
import {
  ENDPOINT_ID_PARAM,
  ENDPOINT_PATH,
  ROTATE_SECRET_PATH,
  WEBHOOK_ENDPOINTS_ROUTE,
  WEBHOOKS_TAG,
} from '../webhooks.constants.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';

const URL_REFUSED = 'The URL is not https (in production), or not a public address';
const SECRETS_UNAVAILABLE = 'The server has no CREDENTIALS_MASTER_KEY to encrypt secrets with';

@ApiTags(WEBHOOKS_TAG)
@Controller(WEBHOOK_ENDPOINTS_ROUTE)
@RequirePermission(WorkspacePermission.ManageWebhooks)
export class WebhookEndpointsController {
  constructor(private readonly endpoints: WebhookEndpointsService) {}

  @Get()
  @ApiOperation({ summary: 'Webhook endpoints of a workspace, oldest first' })
  @ApiOkResponse({ type: [WebhookEndpointDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<WebhookEndpointDto[]> {
    const endpoints = await this.endpoints.list(workspaceId);
    return endpoints.map((endpoint) => WebhookEndpointDto.from(endpoint));
  }

  @Post()
  @ApiOperation({
    summary: 'Add a webhook endpoint. Its signing secret is returned once.',
    description: 'Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.',
  })
  @ApiCreatedResponse({ type: WebhookEndpointWithSecretDto })
  @ApiBadRequestResponse({ description: URL_REFUSED })
  @ApiServiceUnavailableResponse({ description: SECRETS_UNAVAILABLE })
  @ApiPlanLimitResponse()
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CreateWebhookEndpointDto,
    @CurrentActor() actor: Actor,
  ): Promise<WebhookEndpointWithSecretDto> {
    return WebhookEndpointWithSecretDto.from(await this.endpoints.create(workspaceId, body, actor));
  }

  @Get(ENDPOINT_PATH)
  @ApiOperation({ summary: 'One webhook endpoint' })
  @ApiOkResponse({ type: WebhookEndpointDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
  ): Promise<WebhookEndpointDto> {
    return WebhookEndpointDto.from(await this.endpoints.get(workspaceId, endpointId));
  }

  @Patch(ENDPOINT_PATH)
  @ApiOperation({
    summary: 'Change a webhook endpoint, or turn it off or on',
    description:
      'Turning an endpoint off fails what it still had to receive; turning it on clears its ' +
      'failure count. Events from while it was off are not sent.',
  })
  @ApiOkResponse({ type: WebhookEndpointDto })
  @ApiBadRequestResponse({ description: URL_REFUSED })
  async update(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @Body() body: UpdateWebhookEndpointDto,
    @CurrentActor() actor: Actor,
  ): Promise<WebhookEndpointDto> {
    return WebhookEndpointDto.from(
      await this.endpoints.update(workspaceId, endpointId, body, actor),
    );
  }

  @Delete(ENDPOINT_PATH)
  @AllowedWhileReadOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook endpoint and its delivery log' })
  @ApiNoContentResponse()
  delete(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.endpoints.delete(workspaceId, endpointId, actor);
  }

  @Post(ROTATE_SECRET_PATH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Give a webhook endpoint a new signing secret, returned once',
    description:
      'For 24 hours deliveries are signed with both the new and the old secret (two v1 ' +
      'signatures), so the receiver can switch without dropping events.',
  })
  @ApiOkResponse({ type: WebhookEndpointWithSecretDto })
  @ApiServiceUnavailableResponse({ description: SECRETS_UNAVAILABLE })
  async rotateSecret(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @CurrentActor() actor: Actor,
  ): Promise<WebhookEndpointWithSecretDto> {
    return WebhookEndpointWithSecretDto.from(
      await this.endpoints.rotateSecret(workspaceId, endpointId, actor),
    );
  }
}
