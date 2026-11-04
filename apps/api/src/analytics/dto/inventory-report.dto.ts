import { ApiProperty } from '@nestjs/swagger';
import type {
  InventoryReport,
  InventoryValue,
  ListingStatusCount,
  StockLevelCounts,
  StoreHealth,
} from '@crossmart/core';
import { ChannelConnectionStatus, ListingStatus } from '@crossmart/database';
import { CHANNEL_CONNECTION_STATUS_SCHEMA_NAME } from '../../channels/channels.constants.js';
import { LISTING_STATUS_SCHEMA_NAME } from '../../listings/listings.constants.js';

export class InventoryValueDto implements InventoryValue {
  @ApiProperty({
    example: '4120.50',
    description: 'Units on hand times cost; no-cost variants left out',
  })
  atCost: string;

  @ApiProperty({ example: '9800.00', description: 'Units on hand times price' })
  atPrice: string;

  @ApiProperty({ description: 'Available plus held for orders' })
  unitsOnHand: number;

  @ApiProperty({ description: 'Variants with stock on hand but no cost' })
  variantsWithoutCost: number;
}

export class StockLevelCountsDto implements StockLevelCounts {
  @ApiProperty()
  inStock: number;

  @ApiProperty()
  lowStock: number;

  @ApiProperty()
  outOfStock: number;

  @ApiProperty({ description: 'Variants that do not track stock' })
  untracked: number;
}

export class ListingStatusCountDto implements ListingStatusCount {
  @ApiProperty({ enum: ListingStatus, enumName: LISTING_STATUS_SCHEMA_NAME })
  status: ListingStatus;

  @ApiProperty()
  count: number;
}

export class StoreHealthDto implements StoreHealth {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ example: 'shopify' })
  channel: string;

  @ApiProperty({ example: 'Demo Store' })
  displayName: string;

  @ApiProperty({ enum: ChannelConnectionStatus, enumName: CHANNEL_CONNECTION_STATUS_SCHEMA_NAME })
  status: ChannelConnectionStatus;

  @ApiProperty({ type: Date, nullable: true })
  lastSyncedAt: Date | null;

  @ApiProperty({ type: [ListingStatusCountDto], description: 'Every listing status, in order' })
  listings: ListingStatusCountDto[];
}

export class InventoryReportDto implements InventoryReport {
  @ApiProperty({ example: 'USD' })
  currencyCode: string;

  @ApiProperty({ type: InventoryValueDto })
  value: InventoryValueDto;

  @ApiProperty({ type: StockLevelCountsDto })
  stockLevels: StockLevelCountsDto;

  @ApiProperty({ description: 'Available units at or below which stock counts as low' })
  lowStockThreshold: number;

  @ApiProperty({ type: [StoreHealthDto], description: 'Every store, oldest first' })
  stores: StoreHealthDto[];

  static from(report: InventoryReport): InventoryReportDto {
    return Object.assign(new InventoryReportDto(), report);
  }
}
