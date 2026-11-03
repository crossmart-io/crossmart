import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  MOVEMENT_PAGE_DEFAULT_LIMIT,
  MOVEMENT_PAGE_MAX_LIMIT,
  type MovementListQuery,
} from '@crossmart/core';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

export class ListMovementsQueryDto implements MovementListQuery {
  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MOVEMENT_PAGE_MAX_LIMIT,
    default: MOVEMENT_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MOVEMENT_PAGE_MAX_LIMIT)
  limit: number = MOVEMENT_PAGE_DEFAULT_LIMIT;
}
