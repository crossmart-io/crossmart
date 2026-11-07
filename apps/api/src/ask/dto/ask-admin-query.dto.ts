import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  AskChannel,
  type AskConversationQuery,
  AskEscalationStatus,
  AskOutcome,
  type AskQuestionCountQuery,
} from '@crossmart/core';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import {
  ASK_ADMIN_PAGE_DEFAULT_LIMIT,
  ASK_ADMIN_PAGE_MAX_LIMIT,
  ASK_CHANNEL_SCHEMA_NAME,
  ASK_ESCALATION_STATUS_SCHEMA_NAME,
  ASK_OUTCOME_SCHEMA_NAME,
  ASK_QUESTION_COUNT_DEFAULT_LIMIT,
  ASK_QUESTION_COUNT_MAX_LIMIT,
} from '../ask.constants.js';

const QUERY_TRUE = 'true';
const QUERY_FALSE = 'false';

/** A query string boolean: "true" or "false"; anything else stays as sent and fails validation. */
function queryBoolean({ value }: { value: unknown }): unknown {
  if (value === QUERY_TRUE) return true;
  if (value === QUERY_FALSE) return false;
  return value;
}

/** A period of time; either end may be left open. */
export class AskPeriodQueryDto {
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Start, included' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'End, included' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class ListAskConversationsQueryDto
  extends AskPeriodQueryDto
  implements AskConversationQuery
{
  @ApiPropertyOptional({
    enum: AskOutcome,
    enumName: ASK_OUTCOME_SCHEMA_NAME,
    description: 'Only conversations with at least one answer of this outcome',
  })
  @IsOptional()
  @IsEnum(AskOutcome)
  outcome?: AskOutcome;

  @ApiPropertyOptional({ enum: AskChannel, enumName: ASK_CHANNEL_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(AskChannel)
  channel?: AskChannel;

  @ApiPropertyOptional({
    description: 'Only escalated conversations (true) or only others (false)',
  })
  @IsOptional()
  @Transform(queryBoolean)
  @IsBoolean()
  escalated?: boolean;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: ASK_ADMIN_PAGE_MAX_LIMIT,
    default: ASK_ADMIN_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ASK_ADMIN_PAGE_MAX_LIMIT)
  limit: number = ASK_ADMIN_PAGE_DEFAULT_LIMIT;
}

export class AskQuestionCountQueryDto extends AskPeriodQueryDto implements AskQuestionCountQuery {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: ASK_QUESTION_COUNT_MAX_LIMIT,
    default: ASK_QUESTION_COUNT_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ASK_QUESTION_COUNT_MAX_LIMIT)
  limit: number = ASK_QUESTION_COUNT_DEFAULT_LIMIT;
}

export class ListAskEscalationsQueryDto {
  @ApiPropertyOptional({ enum: AskEscalationStatus, enumName: ASK_ESCALATION_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(AskEscalationStatus)
  status?: AskEscalationStatus;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: ASK_ADMIN_PAGE_MAX_LIMIT,
    default: ASK_ADMIN_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ASK_ADMIN_PAGE_MAX_LIMIT)
  limit: number = ASK_ADMIN_PAGE_DEFAULT_LIMIT;
}
