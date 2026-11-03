import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ShopifySettings } from '@crossmart/connectors';
import {
  CatalogGap,
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
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, enumName: PRODUCT_STATUS_SCHEMA_NAME })
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: CatalogGap, enumName: CATALOG_GAP_SCHEMA_NAME })
  gap?: CatalogGap;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional()
  vendor?: string;
}

/** Which products the connection lists: the filter's matches, plus and minus these ids. */
export class ProductSelectionRuleDto implements ProductSelectionRule {
  @ApiProperty({ type: ProductSelectionFilterDto })
  filter: ProductSelectionFilterDto;

  @ApiProperty({ type: [String], format: 'uuid' })
  includeProductIds: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  excludeProductIds: string[];

  static from(rule: ProductSelectionRule): ProductSelectionRuleDto {
    return Object.assign(new ProductSelectionRuleDto(), {
      ...rule,
      filter: Object.assign(new ProductSelectionFilterDto(), rule.filter),
    });
  }
}
