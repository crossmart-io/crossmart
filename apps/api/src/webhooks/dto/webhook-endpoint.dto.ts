import { ApiProperty } from '@nestjs/swagger';
import {
  WebhookEventType,
  type WebhookEndpointView,
  type WebhookEndpointWithSecret,
} from '@crossmart/core';
import { WebhookDisabledReason } from '@crossmart/database';
import {
  WEBHOOK_DISABLED_REASON_SCHEMA_NAME,
  WEBHOOK_EVENT_TYPE_SCHEMA_NAME,
} from '../webhooks.constants.js';

export class WebhookEndpointDto implements WebhookEndpointView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'https://example.com/crossmart/webhooks' })
  url: string;

  @ApiProperty({ type: String, nullable: true, example: 'Order notifications to n8n' })
  description: string | null;

  @ApiProperty({ enum: WebhookEventType, enumName: WEBHOOK_EVENT_TYPE_SCHEMA_NAME, isArray: true })
  eventTypes: WebhookEventType[];

  @ApiProperty({ description: 'False when turned off by someone or after repeated failures' })
  enabled: boolean;

  @ApiProperty({
    enum: WebhookDisabledReason,
    enumName: WEBHOOK_DISABLED_REASON_SCHEMA_NAME,
    nullable: true,
    description: 'MANUAL: turned off by someone. FAILING: turned off by Crossmart.',
  })
  disabledReason: WebhookDisabledReason | null;

  @ApiProperty({ type: Date, nullable: true })
  disabledAt: Date | null;

  @ApiProperty({ description: 'Failed attempts since the last delivery that went through' })
  consecutiveFailures: number;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Until then deliveries are also signed with the secret the last rotation replaced',
  })
  previousSecretExpiresAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(view: WebhookEndpointView): WebhookEndpointDto {
    return Object.assign(new WebhookEndpointDto(), view);
  }
}

export class WebhookEndpointWithSecretDto implements WebhookEndpointWithSecret {
  @ApiProperty({ type: WebhookEndpointDto })
  endpoint: WebhookEndpointDto;

  @ApiProperty({
    example: 'whsec_3q2-7wEXAMPLEsecretVALUE0123456789abcdef',
    description: 'The signing secret. Shown once; store it now.',
  })
  secret: string;

  static from(issued: WebhookEndpointWithSecret): WebhookEndpointWithSecretDto {
    return Object.assign(new WebhookEndpointWithSecretDto(), {
      endpoint: WebhookEndpointDto.from(issued.endpoint),
      secret: issued.secret,
    });
  }
}
