import { ApiProperty } from '@nestjs/swagger';
import {
  WebhookEventType,
  type WebhookDeliveryDetail,
  type WebhookDeliveryPage,
  type WebhookDeliveryView,
  type WebhookEnvelope,
} from '@crossmart/core';
import { WebhookDeliveryStatus } from '@crossmart/database';
import {
  WEBHOOK_DELIVERY_STATUS_SCHEMA_NAME,
  WEBHOOK_EVENT_TYPE_SCHEMA_NAME,
} from '../webhooks.constants.js';

export class WebhookDeliveryDto implements WebhookDeliveryView {
  @ApiProperty({ format: 'uuid', description: 'Sent as the Crossmart-Delivery-Id header' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  endpointId: string;

  @ApiProperty({ format: 'uuid', description: 'The event id; the same on every redelivery' })
  eventId: string;

  @ApiProperty({ enum: WebhookEventType, enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME })
  eventType: WebhookEventType;

  @ApiProperty({
    enum: WebhookDeliveryStatus,
    enumName: WEBHOOK_DELIVERY_STATUS_SCHEMA_NAME,
    description: 'RETRYING: an attempt failed and another is scheduled at nextAttemptAt',
  })
  status: WebhookDeliveryStatus;

  @ApiProperty({ description: 'Attempts made so far' })
  attempts: number;

  @ApiProperty({ type: Number, nullable: true, description: 'HTTP status of the latest attempt' })
  responseStatus: number | null;

  @ApiProperty({ type: Number, nullable: true })
  durationMs: number | null;

  @ApiProperty({ type: String, nullable: true, description: 'Why the latest attempt failed' })
  error: string | null;

  @ApiProperty({ type: Date, nullable: true })
  nextAttemptAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  lastAttemptAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  deliveredAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static from(view: WebhookDeliveryView): WebhookDeliveryDto {
    return Object.assign(new WebhookDeliveryDto(), view);
  }
}

export class WebhookEnvelopeDto implements WebhookEnvelope {
  @ApiProperty({ format: 'uuid', description: 'The event id: deduplicate on it' })
  id: string;

  @ApiProperty({ enum: WebhookEventType, enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME })
  type: WebhookEventType;

  @ApiProperty({ description: 'When the change happened' })
  createdAt: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId: string;

  @ApiProperty({ example: 'v1' })
  apiVersion: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'The event’s data; its shape depends on the type',
  })
  data: Record<string, unknown>;
}

export class WebhookDeliveryDetailDto extends WebhookDeliveryDto implements WebhookDeliveryDetail {
  @ApiProperty({ type: WebhookEnvelopeDto, description: 'The JSON body every attempt sends' })
  payload: WebhookEnvelopeDto;

  static fromDetail(detail: WebhookDeliveryDetail): WebhookDeliveryDetailDto {
    return Object.assign(new WebhookDeliveryDetailDto(), detail);
  }
}

export class WebhookDeliveryPageDto implements WebhookDeliveryPage {
  @ApiProperty({ type: [WebhookDeliveryDto] })
  items: WebhookDeliveryDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty()
  total: number;

  static from(page: WebhookDeliveryPage): WebhookDeliveryPageDto {
    return Object.assign(new WebhookDeliveryPageDto(), {
      ...page,
      items: page.items.map((item) => WebhookDeliveryDto.from(item)),
    });
  }
}
