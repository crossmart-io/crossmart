import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { ShopifySettings } from '@crossmart/connectors';
import {
  CatalogGap,
  PRODUCT_SELECTION_MAX_IDS,
  PRODUCT_SELECTION_MAX_TAGS,
  PRODUCT_SELECTION_TEXT_MAX_LENGTH,
  type ProductSelectionFilter,
  type ProductSelectionRule,
} from '@crossmart/core';
import { ProductStatus } from '@crossmart/database';
import {
  CATALOG_GAP_SCHEMA_NAME,
  PRODUCT_STATUS_SCHEMA_NAME,
} from '../../catalog/catalog.constants.js';

export class ShopifyLocationDto {
  @ApiProperty({ example: 'gid://shopify/Location/1001' })
  id: string;

  @ApiProperty()
  name: string;
}

/** What Crossmart read from the store when it was connected. */
export class ShopifySettingsDto {
  @ApiProperty()
  shopName: string;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the store’s currency' })
  currencyCode: string;

  @ApiProperty({ type: String, nullable: true, example: 'America/New_York' })
  ianaTimezone: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The storefront’s public URL' })
  primaryDomainUrl: string | null;

  @ApiProperty({
    type: ShopifyLocationDto,
    nullable: true,
    description: 'Where Crossmart reads and writes stock',
  })
  primaryLocation: ShopifyLocationDto | null;

  static from(settings: ShopifySettings): ShopifySettingsDto {
    const { channel: _channel, primaryLocation, ...fields } = settings;
    return Object.assign(new ShopifySettingsDto(), {
      ...fields,
      primaryLocation: primaryLocation
        ? Object.assign(new ShopifyLocationDto(), primaryLocation)
        : null,
    });
  }
}

export class ProductSelectionFilterDto implements ProductSelectionFilter {
  @ApiPropertyOptional({ description: 'Matches title, handle or SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SELECTION_TEXT_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, enumName: PRODUCT_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: CatalogGap, enumName: CATALOG_GAP_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(CatalogGap)
  gap?: CatalogGap;

  @ApiPropertyOptional({ type: [String], description: 'Products with any of these tags' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_SELECTION_MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(PRODUCT_SELECTION_TEXT_MAX_LENGTH, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Products of this vendor, ignoring case' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SELECTION_TEXT_MAX_LENGTH)
  vendor?: string;

  toFilter(): ProductSelectionFilter {
    return {
      ...(this.search?.trim() ? { search: this.search.trim() } : {}),
      ...(this.status ? { status: this.status } : {}),
      ...(this.gap ? { gap: this.gap } : {}),
      ...(this.tags?.length ? { tags: this.tags } : {}),
      ...(this.vendor?.trim() ? { vendor: this.vendor.trim() } : {}),
    };
  }
}

/**
 * Which products the connection lists: the filter's matches, plus and minus these ids. A null
 * filter matches nothing, so only `includeProductIds` are listed.
 */
export class ProductSelectionRuleDto implements ProductSelectionRule {
  @ApiProperty({ type: ProductSelectionFilterDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSelectionFilterDto)
  filter: ProductSelectionFilterDto | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(PRODUCT_SELECTION_MAX_IDS)
  @IsUUID('all', { each: true })
  includeProductIds: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(PRODUCT_SELECTION_MAX_IDS)
  @IsUUID('all', { each: true })
  excludeProductIds: string[];

  static from(rule: ProductSelectionRule): ProductSelectionRuleDto {
    return Object.assign(new ProductSelectionRuleDto(), {
      ...rule,
      filter: rule.filter ? Object.assign(new ProductSelectionFilterDto(), rule.filter) : null,
    });
  }

  toRule(): ProductSelectionRule {
    return {
      filter: this.filter ? this.filter.toFilter() : null,
      includeProductIds: [...new Set(this.includeProductIds)],
      excludeProductIds: [...new Set(this.excludeProductIds)],
    };
  }
}
