import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PublishRequirement } from '@crossmart/connectors';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import {
  CHANNEL_LISTINGS_DEFAULT_LIMIT,
  CHANNEL_LISTINGS_MAX_LIMIT,
  type ChannelProductCounts,
  type ChannelProductPage,
  type ChannelProductQuery,
  type ChannelProductRow,
  ChannelProductSort,
  ChannelProductState,
  ChannelProductView,
  ListingDisplayState,
} from '@crossmart/core';
import { SortDirection } from '@crossmart/common';
import { ProductSummaryDto } from '../../catalog/dto/product-summary.dto.js';
import { PRODUCT_SEARCH_MAX_LENGTH } from '../../catalog/catalog.constants.js';
import { SORT_DIRECTION_SCHEMA_NAME } from '../../common/api.constants.js';
import {
  CHANNEL_PRODUCT_SORT_SCHEMA_NAME,
  CHANNEL_PRODUCT_STATE_SCHEMA_NAME,
  CHANNEL_PRODUCT_VIEW_SCHEMA_NAME,
  LISTING_DISPLAY_STATE_SCHEMA_NAME,
} from '../listings.constants.js';
import { ListingSummaryDto } from './channel-listing.dto.js';
import {
  DisplayReasonProperty,
  DisplayRequirementProperty,
  DisplayStateProperty,
} from './listing-display.decorators.js';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

export class ChannelProductCountsDto implements ChannelProductCounts {
  @ApiProperty({ description: 'Selected and on the channel' })
  [ChannelProductState.Listed]: number;

  @ApiProperty({ description: 'Selected, waiting for the next sync to publish them' })
  [ChannelProductState.Pending]: number;

  @ApiProperty({ description: 'Their last sync failed' })
  [ChannelProductState.Failed]: number;

  @ApiProperty({ description: 'On the channel but no longer selected; the next sync delists them' })
  [ChannelProductState.Removing]: number;

  @ApiProperty({ description: 'Removed by hand and off the channel; adding them back undoes it' })
  [ChannelProductState.RemovedByHand]: number;

  @ApiProperty({ description: 'Neither selected nor on the channel' })
  [ChannelProductState.Excluded]: number;

  @ApiProperty({
    description:
      'Products whose display state is `needs_details`: selected, and the store setup or the ' +
      'product lacks something publishing needs. Some may also be counted as `failed`',
  })
  needsDetails: number;

  @ApiProperty({
    description:
      'Products that are failed or need details, each counted once: what `view=needs_attention` ' +
      'lists. Its failed part is `failed`, the same listings the attention summary counts',
  })
  needsAttention: number;
}

export class ChannelProductDto implements ChannelProductRow {
  @ApiProperty({ type: ProductSummaryDto })
  product: ProductSummaryDto;

  @ApiProperty({ enum: ChannelProductState, enumName: CHANNEL_PRODUCT_STATE_SCHEMA_NAME })
  state: ChannelProductState;

  @DisplayStateProperty()
  displayState: ListingDisplayState;

  @DisplayReasonProperty()
  displayReason: string | null;

  @DisplayRequirementProperty()
  displayRequirement: PublishRequirement | null;

  @ApiProperty({ type: ListingSummaryDto, nullable: true })
  listing: ListingSummaryDto | null;

  static from(row: ChannelProductRow): ChannelProductDto {
    return Object.assign(new ChannelProductDto(), {
      product: ProductSummaryDto.from(row.product),
      state: row.state,
      displayState: row.displayState,
      displayReason: row.displayReason,
      displayRequirement: row.displayRequirement,
      listing: row.listing ? ListingSummaryDto.from(row.listing) : null,
    });
  }
}

export class ChannelProductPageDto implements ChannelProductPage {
  @ApiProperty({ type: [ChannelProductDto] })
  items: ChannelProductDto[];

  @ApiProperty({ type: ChannelProductCountsDto })
  counts: ChannelProductCountsDto;

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: ChannelProductPage): ChannelProductPageDto {
    return Object.assign(new ChannelProductPageDto(), {
      items: page.items.map((row) => ChannelProductDto.from(row)),
      counts: Object.assign(new ChannelProductCountsDto(), page.counts),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}

export class ListChannelProductsQueryDto implements ChannelProductQuery {
  @ApiPropertyOptional({ enum: ChannelProductState, enumName: CHANNEL_PRODUCT_STATE_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ChannelProductState)
  state?: ChannelProductState;

  @ApiPropertyOptional({
    enum: ListingDisplayState,
    enumName: LISTING_DISPLAY_STATE_SCHEMA_NAME,
    description:
      'Only products showing this display state. Without `state` it looks at every catalog ' +
      'product, so `draft` and `removed` find those not in the store.',
  })
  @IsOptional()
  @IsEnum(ListingDisplayState)
  displayState?: ListingDisplayState;

  @ApiPropertyOptional({
    enum: ChannelProductView,
    enumName: CHANNEL_PRODUCT_VIEW_SCHEMA_NAME,
    description:
      'Only the products of one view, so each tab of a store page is one request: `all` (in ' +
      'the store), `live` (listed), `needs_attention` (failed or needing details) or ' +
      '`not_listed` (pending, removing, removed by hand or excluded). It combines with `state` ' +
      'and `displayState`',
  })
  @IsOptional()
  @IsEnum(ChannelProductView)
  view?: ChannelProductView;

  @ApiPropertyOptional({ description: 'Matches title, handle or SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({
    enum: ChannelProductSort,
    enumName: CHANNEL_PRODUCT_SORT_SCHEMA_NAME,
    default: ChannelProductSort.Title,
  })
  @IsOptional()
  @IsEnum(ChannelProductSort)
  sort: ChannelProductSort = ChannelProductSort.Title;

  @ApiPropertyOptional({
    enum: SortDirection,
    enumName: SORT_DIRECTION_SCHEMA_NAME,
    default: SortDirection.Asc,
  })
  @IsOptional()
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.Asc;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: CHANNEL_LISTINGS_MAX_LIMIT,
    default: CHANNEL_LISTINGS_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CHANNEL_LISTINGS_MAX_LIMIT)
  limit: number = CHANNEL_LISTINGS_DEFAULT_LIMIT;
}
