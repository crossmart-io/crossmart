import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhookDeliveriesService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ListWebhookDeliveriesQueryDto } from '../dto/list-webhook-deliveries-query.dto.js';
import {
  WebhookDeliveryDetailDto,
  WebhookDeliveryDto,
  WebhookDeliveryPageDto,
} from '../dto/webhook-delivery.dto.js';
import {
  DELIVERIES_PATH,
  DELIVERY_ID_PARAM,
  DELIVERY_PATH,
  ENDPOINT_ID_PARAM,
  REDELIVER_PATH,
  TEST_EVENT_PATH,
  WEBHOOK_ENDPOINTS_ROUTE,
  WEBHOOKS_TAG,
} from '../webhooks.constants.js';

@ApiTags(WEBHOOKS_TAG)
@Controller(WEBHOOK_ENDPOINTS_ROUTE)
@RequirePermission(WorkspacePermission.ManageWebhooks)
export class WebhookDeliveriesController {
  constructor(private readonly deliveries: WebhookDeliveriesService) {}

  @Get(DELIVERIES_PATH)
  @ApiOperation({
    summary: 'The delivery log of a webhook endpoint, newest first',
    description: 'Deliveries are kept for 30 days.',
  })
  @ApiOkResponse({ type: WebhookDeliveryPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @Query() query: ListWebhookDeliveriesQueryDto,
  ): Promise<WebhookDeliveryPageDto> {
    return WebhookDeliveryPageDto.from(await this.deliveries.list(workspaceId, endpointId, query));
  }

  @Get(DELIVERY_PATH)
  @ApiOperation({ summary: 'One delivery, with the JSON body it sends' })
  @ApiOkResponse({ type: WebhookDeliveryDetailDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @Param(DELIVERY_ID_PARAM, ParseUUIDPipe) deliveryId: string,
  ): Promise<WebhookDeliveryDetailDto> {
    return WebhookDeliveryDetailDto.fromDetail(
      await this.deliveries.get(workspaceId, endpointId, deliveryId),
    );
  }

  @Post(REDELIVER_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send a delivery’s event again',
    description: 'A new delivery of the same event, with the same event id, sent right away.',
  })
  @ApiAcceptedResponse({ type: WebhookDeliveryDto })
  async redeliver(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
    @Param(DELIVERY_ID_PARAM, ParseUUIDPipe) deliveryId: string,
  ): Promise<WebhookDeliveryDto> {
    return WebhookDeliveryDto.from(
      await this.deliveries.redeliver(workspaceId, endpointId, deliveryId),
    );
  }

  @Post(TEST_EVENT_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send a test event to a webhook endpoint',
    description:
      'A `webhook.test` event, to this endpoint only and tried once. Its outcome shows in the ' +
      'delivery log within seconds.',
  })
  @ApiAcceptedResponse({ type: WebhookDeliveryDto })
  async sendTest(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ENDPOINT_ID_PARAM, ParseUUIDPipe) endpointId: string,
  ): Promise<WebhookDeliveryDto> {
    return WebhookDeliveryDto.from(await this.deliveries.sendTest(workspaceId, endpointId));
  }
}
