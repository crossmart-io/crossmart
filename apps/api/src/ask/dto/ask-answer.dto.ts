import { ApiProperty } from '@nestjs/swagger';
import { type AskAnswer, type AskCitation, AskConfidence, AskOutcome } from '@crossmart/core';
import { ASK_CONFIDENCE_SCHEMA_NAME, ASK_OUTCOME_SCHEMA_NAME } from '../ask.constants.js';

export class AskCitationDto implements AskCitation {
  @ApiProperty({
    description: 'The page and section, such as "Crossmart for developers › Rate limits"',
  })
  title: string;

  @ApiProperty({ format: 'uri', description: 'The public page the answer is based on' })
  url: string;
}

export class AskAnswerDto implements AskAnswer {
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

  static from(answer: AskAnswer): AskAnswerDto {
    return Object.assign(new AskAnswerDto(), {
      ...answer,
      citations: answer.citations.map((citation) => Object.assign(new AskCitationDto(), citation)),
    });
  }
}
