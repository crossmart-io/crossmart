import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  SUGGESTIONS_PAGE_DEFAULT_LIMIT,
  SUGGESTIONS_PAGE_MAX_LIMIT,
  SuggestionKind,
  type SuggestionQuery,
} from '@crossmart/core';
import { SuggestionStatus } from '@crossmart/database';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import {
  SUGGESTION_KIND_SCHEMA_NAME,
  SUGGESTION_STATUS_SCHEMA_NAME,
} from '../suggestions.constants.js';

/** Filters of the suggestions inbox, newest first. */
export class ListSuggestionsQueryDto implements SuggestionQuery {
  @ApiPropertyOptional({
    enum: SuggestionStatus,
    enumName: SUGGESTION_STATUS_SCHEMA_NAME,
    description: '`PENDING` is the inbox',
  })
  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;

  @ApiPropertyOptional({ format: 'uuid', description: 'Suggestions for one product' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Suggestions for one store' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiPropertyOptional({ enum: SuggestionKind, enumName: SUGGESTION_KIND_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(SuggestionKind)
  kind?: SuggestionKind;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: SUGGESTIONS_PAGE_MAX_LIMIT,
    default: SUGGESTIONS_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SUGGESTIONS_PAGE_MAX_LIMIT)
  limit: number = SUGGESTIONS_PAGE_DEFAULT_LIMIT;
}
