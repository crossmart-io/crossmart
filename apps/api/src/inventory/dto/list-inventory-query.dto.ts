import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import {
  INVENTORY_PAGE_DEFAULT_LIMIT,
  INVENTORY_PAGE_MAX_LIMIT,
  type InventoryListQuery,
  StockLevel,
} from '@crossmart/core';
import { INVENTORY_SEARCH_MAX_LENGTH, STOCK_LEVEL_SCHEMA_NAME } from '../inventory.constants.js';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

export class ListInventoryQueryDto implements InventoryListQuery {
  @ApiPropertyOptional({ description: 'Matches the SKU or the product title' })
  @IsOptional()
  @IsString()
  @MaxLength(INVENTORY_SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({ enum: StockLevel, enumName: STOCK_LEVEL_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(StockLevel)
  stockLevel?: StockLevel;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: INVENTORY_PAGE_MAX_LIMIT,
    default: INVENTORY_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INVENTORY_PAGE_MAX_LIMIT)
  limit: number = INVENTORY_PAGE_DEFAULT_LIMIT;
}
