import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  type NewWebhookEndpoint,
  SUBSCRIBABLE_WEBHOOK_EVENT_TYPES,
  WEBHOOK_DESCRIPTION_MAX_LENGTH,
  WEBHOOK_URL_MAX_LENGTH,
  type WebhookEndpointChanges,
  WebhookEventType,
} from '@crossmart/core';
import { WEBHOOK_EVENT_TYPE_SCHEMA_NAME } from '../webhooks.constants.js';

const URL_DESCRIPTION =
  'Where events are POSTed. https and a public address; plain http only outside production.';
const EVENT_TYPES_DESCRIPTION = 'The events to receive. `webhook.test` cannot be subscribed to.';

export class CreateWebhookEndpointDto implements NewWebhookEndpoint {
  @ApiProperty({ example: 'https://example.com/crossmart/webhooks', description: URL_DESCRIPTION })
  @IsString()
  @IsNotEmpty()
  @MaxLength(WEBHOOK_URL_MAX_LENGTH)
  url: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: WEBHOOK_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(WEBHOOK_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiProperty({
    enum: WebhookEventType,
    enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME,
    isArray: true,
    description: EVENT_TYPES_DESCRIPTION,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SUBSCRIBABLE_WEBHOOK_EVENT_TYPES, { each: true })
  eventTypes: WebhookEventType[];
}

export class UpdateWebhookEndpointDto implements WebhookEndpointChanges {
  @ApiPropertyOptional({ description: URL_DESCRIPTION })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(WEBHOOK_URL_MAX_LENGTH)
  url?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: WEBHOOK_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(WEBHOOK_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiPropertyOptional({
    enum: WebhookEventType,
    enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME,
    isArray: true,
    description: EVENT_TYPES_DESCRIPTION,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(SUBSCRIBABLE_WEBHOOK_EVENT_TYPES, { each: true })
  eventTypes?: WebhookEventType[];

  @ApiPropertyOptional({
    description: 'false turns the endpoint off; true turns it back on and clears its failures',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
