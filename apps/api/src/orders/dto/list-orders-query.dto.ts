import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { SortDirection } from '@crossmart/common';
import {
  ORDER_PAGE_DEFAULT_LIMIT,
  ORDER_PAGE_MAX_LIMIT,
  type OrderListQuery,
} from '@crossmart/core';
import { OrderStatus } from '@crossmart/database';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { SortDirectionProperty } from '../../common/sort-direction.decorator.js';
import { ORDER_SEARCH_MAX_LENGTH, ORDER_STATUS_SCHEMA_NAME } from '../orders.constants.js';

export class ListOrdersQueryDto implements OrderListQuery {
  @ApiPropertyOptional({ enum: OrderStatus, enumName: ORDER_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ format: 'uuid', description: 'Orders of one store' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiPropertyOptional({ description: 'Matches the order number' })
  @IsOptional()
  @IsString()
  @MaxLength(ORDER_SEARCH_MAX_LENGTH)
  search?: string;

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
    maximum: ORDER_PAGE_MAX_LIMIT,
    default: ORDER_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ORDER_PAGE_MAX_LIMIT)
  limit: number = ORDER_PAGE_DEFAULT_LIMIT;
}
