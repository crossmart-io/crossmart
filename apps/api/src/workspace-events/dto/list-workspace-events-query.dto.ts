import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  WORKSPACE_EVENT_PAGE_DEFAULT_LIMIT,
  WORKSPACE_EVENT_PAGE_MAX_LIMIT,
} from '@crossmart/core';

/** The longest cursor this API gives out, with room to spare. */
const CURSOR_MAX_LENGTH = 400;

export class WorkspaceEventCursorQueryDto {
  @ApiPropertyOptional({
    description:
      'The `cursor` of a previous page or event: only what happened after it. Without it, the ' +
      'latest events.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CURSOR_MAX_LENGTH)
  after?: string;
}

export class ListWorkspaceEventsQueryDto extends WorkspaceEventCursorQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: WORKSPACE_EVENT_PAGE_MAX_LIMIT,
    default: WORKSPACE_EVENT_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(WORKSPACE_EVENT_PAGE_MAX_LIMIT)
  limit: number = WORKSPACE_EVENT_PAGE_DEFAULT_LIMIT;
}
