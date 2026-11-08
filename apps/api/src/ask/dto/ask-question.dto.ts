import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import {
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
  AskChannel,
} from '@crossmart/core';
import { ASK_CHANNEL_SCHEMA_NAME } from '../ask.constants.js';
import { CONVERSATION_ID_PATTERN } from './ask-ids.js';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** The channels a caller may name; `a2a` is set by the A2A endpoint only. */
export const CALLER_CHANNELS: readonly AskChannel[] = [
  AskChannel.WebWidget,
  AskChannel.AppWidget,
  AskChannel.Api,
  AskChannel.Mcp,
  AskChannel.AgentWorker,
];

export class AskQuestionDto {
  @ApiProperty({
    minLength: ASK_QUESTION_MIN_LENGTH,
    maxLength: ASK_QUESTION_MAX_LENGTH,
    description: 'A question about Crossmart, in any language',
    example: 'Can I publish the same product to Shopify and eBay?',
  })
  @Transform(trimmed)
  @IsString()
  @MinLength(ASK_QUESTION_MIN_LENGTH)
  @MaxLength(ASK_QUESTION_MAX_LENGTH)
  question: string;

  @ApiPropertyOptional({
    maxLength: ASK_TOKEN_MAX_LENGTH,
    description:
      'The `conversationId` of an earlier answer, to ask a follow-up in the same conversation. ' +
      'Only the same caller can continue it, and it expires after 24 hours without a question.',
    example: 'conv_3q2-7wEXAMPLEd1Yk1x8kz0A6E2r9cP4mT5vW8yB0fH',
  })
  @IsOptional()
  @IsString()
  @MaxLength(ASK_TOKEN_MAX_LENGTH)
  @Matches(CONVERSATION_ID_PATTERN)
  conversationId?: string;

  @ApiPropertyOptional({
    enum: CALLER_CHANNELS,
    enumName: ASK_CHANNEL_SCHEMA_NAME,
    default: AskChannel.Api,
    description: 'Where the question comes from, for Crossmart’s statistics only',
  })
  @IsOptional()
  @IsIn(CALLER_CHANNELS)
  channel?: AskChannel;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'For a signed-in person: a workspace they belong to, so Ask can also answer about it ' +
      '(listings, plan and usage, stores), read-only. API keys and agents always ask from ' +
      'their own workspace.',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
