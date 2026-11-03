import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SortDirection } from '@crossmart/common';
import { InventoryMovementReason } from '@crossmart/database';
import {
  MOVEMENT_PAGE_DEFAULT_LIMIT,
  MOVEMENT_PAGE_MAX_LIMIT,
  type MovementListQuery,
} from '@crossmart/core';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { SortDirectionProperty } from '../../common/sort-direction.decorator.js';
import { INVENTORY_MOVEMENT_REASON_SCHEMA_NAME } from '../inventory.constants.js';

export class ListMovementsQueryDto implements MovementListQuery {
  @ApiPropertyOptional({
    enum: InventoryMovementReason,
    enumName: INVENTORY_MOVEMENT_REASON_SCHEMA_NAME,
  })
  @IsOptional()
  @IsEnum(InventoryMovementReason)
  reason?: InventoryMovementReason;

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
