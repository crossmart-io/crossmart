import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CatalogGap,
  PRODUCT_VIEW_NAME_MAX_LENGTH,
  type ProductViewDraft,
  type SavedProductView,
} from '@crossmart/core';
import { ProductStatus } from '@crossmart/database';
import {
  CATALOG_GAP_SCHEMA_NAME,
  PRODUCT_SEARCH_MAX_LENGTH,
  PRODUCT_STATUS_SCHEMA_NAME,
} from '../catalog.constants.js';

export class CreateProductViewDto implements ProductViewDraft {
  @ApiProperty({ maxLength: PRODUCT_VIEW_NAME_MAX_LENGTH, description: 'Unique in the workspace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_VIEW_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({ description: 'Matches title, handle or SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, enumName: PRODUCT_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: CatalogGap, enumName: CATALOG_GAP_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(CatalogGap)
  gap?: CatalogGap;
}

export class ProductViewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  search: string | null;

  @ApiPropertyOptional({
    enum: ProductStatus,
    enumName: PRODUCT_STATUS_SCHEMA_NAME,
    nullable: true,
  })
  status: ProductStatus | null;

  @ApiPropertyOptional({ enum: CatalogGap, enumName: CATALOG_GAP_SCHEMA_NAME, nullable: true })
  gap: CatalogGap | null;

  @ApiProperty()
  createdAt: Date;

  static from(view: SavedProductView): ProductViewDto {
    return Object.assign(new ProductViewDto(), {
      id: view.id,
      name: view.name,
      search: view.search ?? null,
      status: view.status ?? null,
      gap: view.gap ?? null,
      createdAt: view.createdAt,
    });
  }
}
