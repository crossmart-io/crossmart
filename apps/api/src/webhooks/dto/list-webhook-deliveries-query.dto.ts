import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SortDirection } from '@crossmart/common';
import { type WebhookDeliveryQuery, WebhookEventType } from '@crossmart/core';
import { WebhookDeliveryStatus } from '@crossmart/database';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { SortDirectionProperty } from '../../common/sort-direction.decorator.js';
import {
  WEBHOOK_DELIVERY_PAGE_DEFAULT_LIMIT,
  WEBHOOK_DELIVERY_PAGE_MAX_LIMIT,
  WEBHOOK_DELIVERY_STATUS_SCHEMA_NAME,
  WEBHOOK_EVENT_TYPE_SCHEMA_NAME,
} from '../webhooks.constants.js';

export class ListWebhookDeliveriesQueryDto implements WebhookDeliveryQuery {
  @ApiPropertyOptional({
    enum: WebhookDeliveryStatus,
    enumName: WEBHOOK_DELIVERY_STATUS_SCHEMA_NAME,
  })
  @IsOptional()
  @IsEnum(WebhookDeliveryStatus)
  status?: WebhookDeliveryStatus;

  @ApiPropertyOptional({ enum: WebhookEventType, enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(WebhookEventType)
  eventType?: WebhookEventType;

  @SortDirectionProperty(SortDirection.Desc)
  direction?: SortDirection;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: WEBHOOK_DELIVERY_PAGE_MAX_LIMIT,
    default: WEBHOOK_DELIVERY_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(WEBHOOK_DELIVERY_PAGE_MAX_LIMIT)
  limit: number = WEBHOOK_DELIVERY_PAGE_DEFAULT_LIMIT;
}
