import { ApiProperty } from '@nestjs/swagger';
import {
  type AskCitation,
  AskConfidence,
  type AskEscalationOffer,
  AskEscalationReason,
  AskOutcome,
  type AskReply,
} from '@crossmart/core';
import {
  ASK_CONFIDENCE_SCHEMA_NAME,
  ASK_ESCALATION_REASON_SCHEMA_NAME,
  ASK_OUTCOME_SCHEMA_NAME,
} from '../ask.constants.js';

export class AskCitationDto implements AskCitation {
  @ApiProperty({
    description: 'The page and section, such as "Crossmart for developers › Rate limits"',
  })
  title: string;

  @ApiProperty({
    format: 'uri',
    description:
      'The public page the answer is based on, or for an account answer the page of the ' +
      'Crossmart app it comes from',
  })
  url: string;
}

export class AskEscalationOfferDto implements AskEscalationOffer {
  @ApiProperty({
    description:
      'True when a person can follow up: call `POST /api/v1/ask/escalations` with the ' +
      '`conversationId` to reach one',
  })
  offered: boolean;

  @ApiProperty({
    enum: AskEscalationReason,
    enumName: ASK_ESCALATION_REASON_SCHEMA_NAME,
    nullable: true,
    description: 'Why a person is offered; null when none is',
  })
  reason: AskEscalationReason | null;
}

export class AskAnswerDto implements AskReply {
  @ApiProperty({
    enum: AskOutcome,
    enumName: ASK_OUTCOME_SCHEMA_NAME,
    description:
      '`answered` from the cited pages; `unknown` when the docs do not answer it (the answer ' +
      'points to support); `out_of_scope` when it is not about Crossmart',
  })
  outcome: AskOutcome;

  @ApiProperty({ description: 'The answer, in plain text (no Markdown)' })
  answer: string;

  @ApiProperty({ type: [AskCitationDto], description: 'Pages the answer is based on' })
  citations: AskCitationDto[];

  @ApiProperty({ enum: AskConfidence, enumName: ASK_CONFIDENCE_SCHEMA_NAME })
  confidence: AskConfidence;

  @ApiProperty({ description: 'True when a person should take over, at supportEmail' })
  handoff: boolean;

  @ApiProperty({ format: 'email' })
  supportEmail: string;

  @ApiProperty({
    description:
      'Send it as `conversationId` with a follow-up question. Only you can continue the ' +
      'conversation, for 24 hours after its last question.',
  })
  conversationId: string;

  @ApiProperty({ format: 'uuid', description: 'This question and answer, as stored' })
  turnId: string;

  @ApiProperty({ type: AskEscalationOfferDto })
  escalation: AskEscalationOfferDto;

  static from(reply: AskReply): AskAnswerDto {
    return Object.assign(new AskAnswerDto(), {
      ...reply,
      citations: reply.citations.map((citation) => Object.assign(new AskCitationDto(), citation)),
      escalation: Object.assign(new AskEscalationOfferDto(), reply.escalation),
    });
  }
}
