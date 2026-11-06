import { ApiProperty } from '@nestjs/swagger';
import {
  type ListingHealthReport,
  ListingDisplayState,
  type ListingStateCount,
  type StoreListingHealth,
  type StoreListingRow,
} from '@crossmart/core';
import { ChannelConnectionStatus } from '@crossmart/database';
import { CHANNEL_CONNECTION_STATUS_SCHEMA_NAME } from '../../channels/channels.constants.js';
import { ChannelListingDto } from '../../listings/dto/channel-listing.dto.js';
import { LISTING_DISPLAY_STATE_SCHEMA_NAME } from '../../listings/listings.constants.js';

export class ListingStateCountDto implements ListingStateCount {
  @ApiProperty({ enum: ListingDisplayState, enumName: LISTING_DISPLAY_STATE_SCHEMA_NAME })
  state: ListingDisplayState;

  @ApiProperty({ description: 'Products of the catalog in this state on the store' })
  count: number;
}

export class StoreListingHealthDto implements StoreListingHealth {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ example: 'shopify' })
  channel: string;

  @ApiProperty({ example: 'Demo Store' })
  displayName: string;

  @ApiProperty({ enum: ChannelConnectionStatus, enumName: CHANNEL_CONNECTION_STATUS_SCHEMA_NAME })
  status: ChannelConnectionStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Why the store needs reconnecting or is in error; null otherwise',
  })
  statusReason: string | null;

  @ApiProperty({ type: Date, nullable: true })
  lastSyncedAt: Date | null;

  @ApiProperty({
    type: [ListingStateCountDto],
    description:
      'Every display state, in order, with how many products are in it: the same states and ' +
      'rule as the store’s product list (`draft` counts the catalog products not in the store)',
  })
  states: ListingStateCountDto[];

  @ApiProperty({ description: 'Listings the channel refused on their last sync' })
  failedListings: number;
}

export class StoreListingFailureDto extends ChannelListingDto implements StoreListingRow {
  @ApiProperty({ format: 'uuid', description: 'The store the listing is on' })
  connectionId: string;

  static fromStoreRow(row: StoreListingRow): StoreListingFailureDto {
    return Object.assign(new StoreListingFailureDto(), ChannelListingDto.fromRow(row), {
      connectionId: row.connectionId,
    });
  }
}

export class ListingHealthReportDto implements ListingHealthReport {
  @ApiProperty({ type: [StoreListingHealthDto], description: 'Every store, oldest first' })
  stores: StoreListingHealthDto[];

  @ApiProperty({
    type: [StoreListingFailureDto],
    description:
      'The latest listings a channel refused, latest first, each with its display state and ' +
      'requirement so a client can link to the fix',
  })
  recentFailures: StoreListingFailureDto[];

  @ApiProperty({ description: 'Failed listings in all, across the stores' })
  failedListings: number;

  static from(report: ListingHealthReport): ListingHealthReportDto {
    return Object.assign(new ListingHealthReportDto(), {
      ...report,
      recentFailures: report.recentFailures.map((row) => StoreListingFailureDto.fromStoreRow(row)),
    });
  }
}
