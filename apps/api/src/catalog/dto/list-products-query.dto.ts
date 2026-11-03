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
  ValidateIf,
} from 'class-validator';
import { SortDirection } from '@crossmart/common';
import {
  CatalogGap,
  PRODUCT_PAGE_DEFAULT_LIMIT,
  PRODUCT_PAGE_MAX_LIMIT,
  type ProductListQuery,
  ProductSort,
  ProductStoreFilter,
} from '@crossmart/core';
import { ProductStatus } from '@crossmart/database';
import {
  CATALOG_GAP_SCHEMA_NAME,
  PRODUCT_FILTER_MAX_TAGS,
  PRODUCT_SEARCH_MAX_LENGTH,
  PRODUCT_SORT_SCHEMA_NAME,
  PRODUCT_STATUS_SCHEMA_NAME,
  PRODUCT_STORE_FILTER_SCHEMA_NAME,
} from '../catalog.constants.js';
import { SORT_DIRECTION_SCHEMA_NAME } from '../../common/api.constants.js';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

/** Store filters that are about one store, so they need its id. */
const STORE_FILTERS_WITH_STORE: ReadonlySet<ProductStoreFilter | undefined> = new Set([
  ProductStoreFilter.InStore,
  ProductStoreFilter.NotInStore,
]);

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

  @ApiPropertyOptional({
    enum: ProductStoreFilter,
    enumName: PRODUCT_STORE_FILTER_SCHEMA_NAME,
    description: 'By the stores products are in; `in_store` and `not_in_store` need `storeId`',
  })
  @IsOptional()
  @IsEnum(ProductStoreFilter)
  storeFilter?: ProductStoreFilter;

  @ApiPropertyOptional({ format: 'uuid', description: 'The store `storeFilter` is about' })
  @ValidateIf((query: ListProductsQueryDto) => STORE_FILTERS_WITH_STORE.has(query.storeFilter))
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    enum: ProductSort,
    enumName: PRODUCT_SORT_SCHEMA_NAME,
    default: ProductSort.Title,
  })
  @IsOptional()
  @IsEnum(ProductSort)
  sort: ProductSort = ProductSort.Title;

  @ApiPropertyOptional({
    enum: SortDirection,
    enumName: SORT_DIRECTION_SCHEMA_NAME,
    default: SortDirection.Asc,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.Asc;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

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
