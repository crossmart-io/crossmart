import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  AccountLookupKind,
  ASK_REPLY_MAX_LENGTH,
  AskCallerType,
  AskChannel,
  AskConfidence,
  type AskConversationDetail,
  type AskConversationPage,
  type AskConversationSummary,
  type AskEscalationRecord,
  AskEscalationReason,
  AskEscalationStatus,
  AskOutcome,
  type AskQuestionCount,
  type AskTurnRecord,
} from '@crossmart/core';
import {
  ASK_CALLER_TYPE_SCHEMA_NAME,
  ASK_CHANNEL_SCHEMA_NAME,
  ASK_CONFIDENCE_SCHEMA_NAME,
  ASK_ESCALATION_REASON_SCHEMA_NAME,
  ASK_ESCALATION_STATUS_SCHEMA_NAME,
  ASK_LOOKUP_KIND_SCHEMA_NAME,
  ASK_OUTCOME_SCHEMA_NAME,
} from '../ask.constants.js';
import { AskCitationDto } from './ask-answer.dto.js';

export class AskConversationSummaryDto implements AskConversationSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: AskChannel, enumName: ASK_CHANNEL_SCHEMA_NAME })
  channel: AskChannel;

  @ApiProperty({ enum: AskCallerType, enumName: ASK_CALLER_TYPE_SCHEMA_NAME })
  callerType: AskCallerType;

  @ApiProperty({ type: String, nullable: true, description: 'The agent’s name, for agents' })
  clientName: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  workspaceId: string | null;

  @ApiProperty()
  turnCount: number;

  @ApiProperty({ type: String, nullable: true, description: 'The first question, redacted' })
  firstQuestion: string | null;

  @ApiProperty({ enum: AskOutcome, enumName: ASK_OUTCOME_SCHEMA_NAME, nullable: true })
  lastOutcome: AskOutcome | null;

  @ApiProperty()
  escalated: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastActivityAt: Date;

  static from(summary: AskConversationSummary): AskConversationSummaryDto {
    return Object.assign(new AskConversationSummaryDto(), summary);
  }
}

export class AskConversationPageDto implements AskConversationPage {
  @ApiProperty({ type: [AskConversationSummaryDto] })
  items: AskConversationSummaryDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty()
  total: number;

  static from(page: AskConversationPage): AskConversationPageDto {
    return Object.assign(new AskConversationPageDto(), {
      ...page,
      items: page.items.map((item) => AskConversationSummaryDto.from(item)),
    });
  }
}

export class AskTurnDto implements AskTurnRecord {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ description: 'The question, with obvious secrets and emails redacted' })
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty({ enum: AskOutcome, enumName: ASK_OUTCOME_SCHEMA_NAME })
  outcome: AskOutcome;

  @ApiProperty({ enum: AskConfidence, enumName: ASK_CONFIDENCE_SCHEMA_NAME })
  confidence: AskConfidence;

  @ApiProperty({ type: [AskCitationDto] })
  citations: AskCitationDto[];

  @ApiProperty({ enum: AccountLookupKind, enumName: ASK_LOOKUP_KIND_SCHEMA_NAME, isArray: true })
  accountLookups: AccountLookupKind[];

  @ApiProperty({
    enum: AskEscalationReason,
    enumName: ASK_ESCALATION_REASON_SCHEMA_NAME,
    nullable: true,
  })
  escalationReason: AskEscalationReason | null;

  @ApiProperty()
  latencyMs: number;

  @ApiProperty({ type: String, nullable: true })
  model: string | null;

  @ApiProperty()
  cached: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class AskEscalationRecordDto implements AskEscalationRecord {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ enum: AskEscalationReason, enumName: ASK_ESCALATION_REASON_SCHEMA_NAME })
  reason: AskEscalationReason;

  @ApiProperty({ enum: AskEscalationStatus, enumName: ASK_ESCALATION_STATUS_SCHEMA_NAME })
  status: AskEscalationStatus;

  @ApiProperty({ type: String, nullable: true })
  contactEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  callbackUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  reply: string | null;

  @ApiProperty({ type: Date, nullable: true })
  repliedAt: Date | null;

  @ApiProperty({ type: String, nullable: true, description: 'The admin who replied' })
  repliedBy: string | null;

  @ApiProperty({ type: Date, nullable: true })
  callbackDeliveredAt: Date | null;

  @ApiProperty({ type: String, nullable: true, description: 'Why the callback failed' })
  callbackError: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(record: AskEscalationRecord): AskEscalationRecordDto {
    return Object.assign(new AskEscalationRecordDto(), record);
  }
}

export class AskConversationDetailDto
  extends AskConversationSummaryDto
  implements AskConversationDetail
{
  @ApiProperty({ type: [AskTurnDto] })
  turns: AskTurnDto[];

  @ApiProperty({ type: [AskEscalationRecordDto] })
  escalations: AskEscalationRecordDto[];

  static fromDetail(detail: AskConversationDetail): AskConversationDetailDto {
    return Object.assign(new AskConversationDetailDto(), {
      ...detail,
      turns: detail.turns.map((turn) => Object.assign(new AskTurnDto(), turn)),
      escalations: detail.escalations.map((escalation) => AskEscalationRecordDto.from(escalation)),
    });
  }
}

export class AskQuestionCountDto implements AskQuestionCount {
  @ApiProperty({ description: 'One of the questions asked alike, redacted' })
  question: string;

  @ApiProperty({ description: 'How many times it was asked in the period' })
  count: number;

  @ApiProperty()
  lastAskedAt: Date;

  static from(count: AskQuestionCount): AskQuestionCountDto {
    return Object.assign(new AskQuestionCountDto(), count);
  }
}

export class ReplyAskEscalationDto {
  @ApiProperty({
    minLength: 1,
    maxLength: ASK_REPLY_MAX_LENGTH,
    description: 'Plain text; it is emailed and POSTed to the callback as written',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(ASK_REPLY_MAX_LENGTH)
  reply: string;
}
