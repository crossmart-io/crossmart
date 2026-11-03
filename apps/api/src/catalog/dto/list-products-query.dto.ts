import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CatalogGap,
  PRODUCT_PAGE_DEFAULT_LIMIT,
  PRODUCT_PAGE_MAX_LIMIT,
  type ProductListQuery,
} from '@crossmart/core';
import { ProductStatus } from '@crossmart/database';
import {
  CATALOG_GAP_SCHEMA_NAME,
  PRODUCT_FILTER_MAX_TAGS,
  PRODUCT_SEARCH_MAX_LENGTH,
  PRODUCT_STATUS_SCHEMA_NAME,
} from '../catalog.constants.js';

export class ListProductsQueryDto implements ProductListQuery {
  @ApiPropertyOptional({ description: 'Matches title, handle or SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, enumName: PRODUCT_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    enum: CatalogGap,
    enumName: CATALOG_GAP_SCHEMA_NAME,
    description: 'Only products that lack this value',
  })
  @IsOptional()
  @IsEnum(CatalogGap)
  gap?: CatalogGap;

  @ApiPropertyOptional({
    type: [String],
    description: 'Only products with any of these tags. Repeat the parameter for several.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => [value].flat())
  @IsArray()
  @ArrayMaxSize(PRODUCT_FILTER_MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(PRODUCT_SEARCH_MAX_LENGTH, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Only products of this vendor, ignoring case' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SEARCH_MAX_LENGTH)
  vendor?: string;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PRODUCT_PAGE_MAX_LIMIT,
    default: PRODUCT_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PRODUCT_PAGE_MAX_LIMIT)
  limit: number = PRODUCT_PAGE_DEFAULT_LIMIT;
}
