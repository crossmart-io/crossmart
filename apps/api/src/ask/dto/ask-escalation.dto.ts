import { ApiProperty } from '@nestjs/swagger';
import {
  AskEscalationReason,
  AskEscalationStatus,
  type AskEscalationTicket,
  type OpenedAskEscalation,
} from '@crossmart/core';
import {
  ASK_ESCALATION_REASON_SCHEMA_NAME,
  ASK_ESCALATION_STATUS_SCHEMA_NAME,
} from '../ask.constants.js';

export class AskEscalationDto implements AskEscalationTicket {
  @ApiProperty({
    description:
      'The ticket id. It is the only way to read the escalation, so keep it like a password.',
  })
  id: string;

  @ApiProperty({ enum: AskEscalationStatus, enumName: ASK_ESCALATION_STATUS_SCHEMA_NAME })
  status: AskEscalationStatus;

  @ApiProperty({ enum: AskEscalationReason, enumName: ASK_ESCALATION_REASON_SCHEMA_NAME })
  reason: AskEscalationReason;

  @ApiProperty({ type: String, nullable: true, description: 'The team’s reply, once sent' })
  reply: string | null;

  @ApiProperty({ type: Date, nullable: true })
  repliedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static from(ticket: AskEscalationTicket): AskEscalationDto {
    return Object.assign(new AskEscalationDto(), ticket);
  }
}

export class OpenedAskEscalationDto extends AskEscalationDto implements OpenedAskEscalation {
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Verifies the callback’s `Crossmart-Signature`, as for webhooks. Shown only now; null ' +
      'without a callback URL.',
  })
  callbackSecret: string | null;

  static fromOpened(opened: OpenedAskEscalation): OpenedAskEscalationDto {
    return Object.assign(new OpenedAskEscalationDto(), opened);
  }
}
