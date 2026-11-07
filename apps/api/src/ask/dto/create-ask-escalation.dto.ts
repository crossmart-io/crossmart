import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import {
  ASK_CALLBACK_URL_MAX_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
  type AskEscalationInput,
  AskEscalationReason,
} from '@crossmart/core';
import { ASK_ESCALATION_REASON_SCHEMA_NAME } from '../ask.constants.js';
import { CONVERSATION_ID_PATTERN } from './ask-ids.js';

const CALLBACK_PROTOCOLS = ['https', 'http'];

export class CreateAskEscalationDto implements AskEscalationInput {
  @ApiProperty({
    maxLength: ASK_TOKEN_MAX_LENGTH,
    description: 'The `conversationId` of your conversation with Ask Crossmart',
  })
  @IsString()
  @MaxLength(ASK_TOKEN_MAX_LENGTH)
  @Matches(CONVERSATION_ID_PATTERN)
  conversationId: string;

  @ApiPropertyOptional({
    format: 'email',
    description: 'Where a person from the Crossmart team should email the reply',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    format: 'uri',
    maxLength: ASK_CALLBACK_URL_MAX_LENGTH,
    description:
      'A public https URL the reply is POSTed to, signed like Crossmart webhooks with the ' +
      '`callbackSecret` this call returns (event type `ask.escalation.replied`)',
  })
  @IsOptional()
  @IsUrl({ protocols: CALLBACK_PROTOCOLS, require_protocol: true, require_tld: false })
  @MaxLength(ASK_CALLBACK_URL_MAX_LENGTH)
  callbackUrl?: string;

  @ApiPropertyOptional({
    enum: AskEscalationReason,
    enumName: ASK_ESCALATION_REASON_SCHEMA_NAME,
    description: 'Why; defaults to the reason Ask last offered a person, else `human_requested`',
  })
  @IsOptional()
  @IsEnum(AskEscalationReason)
  reason?: AskEscalationReason;
}
