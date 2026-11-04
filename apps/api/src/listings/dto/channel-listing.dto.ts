import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  CHANNEL_LISTINGS_DEFAULT_LIMIT,
  CHANNEL_LISTINGS_MAX_LIMIT,
  type ChannelListingPage,
  type ChannelListingQuery,
  type ChannelListingRow,
  type ListingSummary,
  type SyncRequestResult,
} from '@crossmart/core';
import { ListingSource, ListingStatus } from '@crossmart/database';
import { LISTING_SOURCE_SCHEMA_NAME, LISTING_STATUS_SCHEMA_NAME } from '../listings.constants.js';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { ChannelCategoryDto } from './channel-category.dto.js';

export class ListingSummaryDto implements ListingSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ListingStatus, enumName: LISTING_STATUS_SCHEMA_NAME })
  status: ListingStatus;

  @ApiProperty({
    enum: ListingSource,
    enumName: LISTING_SOURCE_SCHEMA_NAME,
    description:
      'How the product joined the store: by hand, by an import, or by the automatic rule',
  })
  source: ListingSource;

  @ApiProperty({ type: String, nullable: true, description: 'The product’s id on the channel' })
  externalId: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Where to see it on the channel' })
  externalUrl: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Why the last sync failed' })
  lastError: string | null;

  @ApiProperty({ type: Date, nullable: true })
  lastSyncedAt: Date | null;

  @ApiProperty({
    type: ChannelCategoryDto,
    nullable: true,
    description: 'The channel category it is listed in, on channels with categories (eBay)',
  })
  category: ChannelCategoryDto | null;

  static from(summary: ListingSummary): ListingSummaryDto {
    return Object.assign(new ListingSummaryDto(), {
      ...summary,
      category: ChannelCategoryDto.fromNullable(summary.category),
    });
  }
}

export class ChannelListingDto extends ListingSummaryDto implements ChannelListingRow {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  variantCount: number;

  static fromRow(row: ChannelListingRow): ChannelListingDto {
    return Object.assign(new ChannelListingDto(), {
      ...row,
      category: ChannelCategoryDto.fromNullable(row.category),
    });
  }
}

export class ChannelListingPageDto implements ChannelListingPage {
  @ApiProperty({ type: [ChannelListingDto] })
  items: ChannelListingDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: ChannelListingPage): ChannelListingPageDto {
    return Object.assign(new ChannelListingPageDto(), {
      items: page.items.map((row) => ChannelListingDto.fromRow(row)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}

export class ListChannelListingsQueryDto implements ChannelListingQuery {
  @ApiPropertyOptional({ enum: ListingStatus, enumName: LISTING_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

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

export class SyncRequestResultDto implements SyncRequestResult {
  @ApiProperty({ description: 'Selected products queued to be published or updated' })
  queued: number;

  @ApiProperty({ description: 'Listings queued to be delisted, as they are no longer selected' })
  delisting: number;

  static from(result: SyncRequestResult): SyncRequestResultDto {
    return Object.assign(new SyncRequestResultDto(), result);
  }
}
