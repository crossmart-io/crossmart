import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  ListingDisplayState,
} from '@crossmart/core';
import { SortDirection } from '@crossmart/common';
import { ProductSummaryDto } from '../../catalog/dto/product-summary.dto.js';
import { PRODUCT_SEARCH_MAX_LENGTH } from '../../catalog/catalog.constants.js';
import { SORT_DIRECTION_SCHEMA_NAME } from '../../common/api.constants.js';
import {
  CHANNEL_PRODUCT_SORT_SCHEMA_NAME,
  CHANNEL_PRODUCT_STATE_SCHEMA_NAME,
} from '../listings.constants.js';
import { ListingSummaryDto } from './channel-listing.dto.js';
import { DisplayReasonProperty, DisplayStateProperty } from './listing-display.decorators.js';
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

  @ApiProperty({ type: ListingSummaryDto, nullable: true })
  listing: ListingSummaryDto | null;

  static from(row: ChannelProductRow): ChannelProductDto {
    return Object.assign(new ChannelProductDto(), {
      product: ProductSummaryDto.from(row.product),
      state: row.state,
      displayState: row.displayState,
      displayReason: row.displayReason,
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
