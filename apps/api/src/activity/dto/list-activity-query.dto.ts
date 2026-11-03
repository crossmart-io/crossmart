import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  ACTIVITY_PAGE_DEFAULT_LIMIT,
  ACTIVITY_PAGE_MAX_LIMIT,
  ActivityAction,
  type ActivityQuery,
  ActivitySubjectType,
} from '@crossmart/core';
import { ActivityOutcome } from '@crossmart/database';
import {
  ACTIVITY_ACTION_SCHEMA_NAME,
  ACTIVITY_OUTCOME_SCHEMA_NAME,
  ACTIVITY_SUBJECT_TYPE_SCHEMA_NAME,
} from '../activity.constants.js';
import { SortDirection } from '@crossmart/common';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { SortDirectionProperty } from '../../common/sort-direction.decorator.js';

/** Filters shared by every activity list. */
export class ActivityFilterQueryDto implements ActivityQuery {
  @ApiPropertyOptional({ enum: ActivityAction, enumName: ACTIVITY_ACTION_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiPropertyOptional({
    enum: ActivityOutcome,
    enumName: ACTIVITY_OUTCOME_SCHEMA_NAME,
    description: '`FAILED` lists only what went wrong',
  })
  @IsOptional()
  @IsEnum(ActivityOutcome)
  outcome?: ActivityOutcome;

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
    maximum: ACTIVITY_PAGE_MAX_LIMIT,
    default: ACTIVITY_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ACTIVITY_PAGE_MAX_LIMIT)
  limit: number = ACTIVITY_PAGE_DEFAULT_LIMIT;
}

export class ListActivityQueryDto extends ActivityFilterQueryDto {
  @ApiPropertyOptional({ enum: ActivitySubjectType, enumName: ACTIVITY_SUBJECT_TYPE_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ActivitySubjectType)
  subjectType?: ActivitySubjectType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Events about this record, including bulk actions that touched it',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only what this user did' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only what this API key did' })
  @IsOptional()
  @IsUUID()
  actorApiKeyId?: string;
}
