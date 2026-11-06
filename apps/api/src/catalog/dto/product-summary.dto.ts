import { ApiProperty } from '@nestjs/swagger';
import { ChannelType, PublishRequirement } from '@crossmart/connectors';
import {
  type DisplayedProductPage,
  type DisplayedProductSummary,
  type DisplayedStoreBadge,
  ListingDisplayState,
  type PriceRange,
} from '@crossmart/core';
import { ListingSource, ListingStatus, ProductStatus } from '@crossmart/database';
import { CHANNEL_TYPE_SCHEMA_NAME } from '../../channels/channels.constants.js';
import {
  LISTING_SOURCE_SCHEMA_NAME,
  LISTING_STATUS_SCHEMA_NAME,
} from '../../listings/listings.constants.js';
import {
  DisplayReasonProperty,
  DisplayRequirementProperty,
  DisplayStateProperty,
} from '../../listings/dto/listing-display.decorators.js';
import { PRODUCT_STATUS_SCHEMA_NAME } from '../catalog.constants.js';

export class PriceRangeDto implements PriceRange {
  @ApiProperty({ example: '22.00', description: 'Decimal string in the workspace currency' })
  min: string;

  @ApiProperty({ example: '89.00' })
  max: string;
}

export class ProductStoreBadgeDto implements DisplayedStoreBadge {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty({ example: 'Demo Store' })
  storeName: string;

  @ApiProperty({ enum: ListingStatus, enumName: LISTING_STATUS_SCHEMA_NAME })
  status: ListingStatus;

  @ApiProperty({ enum: ListingSource, enumName: LISTING_SOURCE_SCHEMA_NAME })
  source: ListingSource;

  @DisplayStateProperty()
  displayState: ListingDisplayState;

  @DisplayReasonProperty()
  displayReason: string | null;

  @DisplayRequirementProperty()
  displayRequirement: PublishRequirement | null;
}

export class ProductSummaryDto implements DisplayedProductSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  handle: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ProductStatus, enumName: PRODUCT_STATUS_SCHEMA_NAME })
  status: ProductStatus;

  @ApiProperty({ type: String, nullable: true })
  vendor: string | null;

  @ApiProperty({ type: String, nullable: true })
  productType: string | null;

  @ApiProperty()
  variantCount: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Stock across variants that track it; null when none do',
  })
  totalAvailable: number | null;

  @ApiProperty({ type: PriceRangeDto, nullable: true })
  priceRange: PriceRangeDto | null;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({
    type: [ProductStoreBadgeDto],
    description: 'The stores it is in, in the order it joined them',
  })
  stores: ProductStoreBadgeDto[];

  @ApiProperty()
  updatedAt: Date;

  static from(summary: DisplayedProductSummary): ProductSummaryDto {
    return Object.assign(new ProductSummaryDto(), {
      ...summary,
      stores: summary.stores.map((badge) => Object.assign(new ProductStoreBadgeDto(), badge)),
    });
  }
}

export class ProductPageDto implements DisplayedProductPage {
  @ApiProperty({ type: [ProductSummaryDto] })
  items: ProductSummaryDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: DisplayedProductPage): ProductPageDto {
    return Object.assign(new ProductPageDto(), {
      items: page.items.map((item) => ProductSummaryDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
