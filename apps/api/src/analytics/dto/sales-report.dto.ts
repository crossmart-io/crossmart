import { ApiProperty } from '@nestjs/swagger';
import {
  type ConnectionSales,
  SalesInterval,
  SalesRange,
  type SalesBucket,
  type SalesReport,
  type SalesStore,
  type SalesTotals,
  type TopProduct,
} from '@crossmart/core';
import { SALES_INTERVAL_SCHEMA_NAME, SALES_RANGE_SCHEMA_NAME } from '../analytics.constants.js';

export class SalesTotalsDto implements SalesTotals {
  @ApiProperty({ example: '1290.00', description: 'Order totals, cancelled orders left out' })
  sales: string;

  @ApiProperty()
  orders: number;

  @ApiProperty({ description: 'Units ordered' })
  units: number;

  @ApiProperty({ type: String, nullable: true, example: '43.00', description: 'Sales per order' })
  averageOrderValue: string | null;
}

export class ConnectionSalesDto implements ConnectionSales {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ example: '120.00' })
  sales: string;

  @ApiProperty()
  orders: number;
}

export class SalesBucketDto implements SalesBucket {
  @ApiProperty({ example: '2026-11-04', description: 'First day of the bucket, in the time zone' })
  startsOn: string;

  @ApiProperty({ example: '120.00' })
  sales: string;

  @ApiProperty()
  orders: number;

  @ApiProperty({ example: '2026-10-05', description: 'First day of the matching earlier bucket' })
  previousStartsOn: string;

  @ApiProperty({ example: '80.00' })
  previousSales: string;

  @ApiProperty({ type: [ConnectionSalesDto], description: 'Stores with orders in the bucket' })
  byConnection: ConnectionSalesDto[];
}

export class SalesStoreDto extends ConnectionSalesDto implements SalesStore {
  @ApiProperty({ example: 'shopify' })
  channel: string;

  @ApiProperty({ example: 'Demo Store' })
  displayName: string;
}

export class TopProductDto implements TopProduct {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  units: number;

  @ApiProperty({ example: '240.00', description: 'Line prices times units' })
  sales: string;
}

export class SalesReportDto implements SalesReport {
  @ApiProperty({ enum: SalesRange, enumName: SALES_RANGE_SCHEMA_NAME })
  range: SalesRange;

  @ApiProperty({ enum: SalesInterval, enumName: SALES_INTERVAL_SCHEMA_NAME })
  interval: SalesInterval;

  @ApiProperty({ example: 'America/New_York' })
  timeZone: string;

  @ApiProperty({ example: 'USD', description: 'The workspace currency; amounts are in it' })
  currencyCode: string;

  @ApiProperty({ type: SalesTotalsDto })
  current: SalesTotalsDto;

  @ApiProperty({ type: SalesTotalsDto, description: 'The period of the same length before' })
  previous: SalesTotalsDto;

  @ApiProperty({ type: [SalesBucketDto] })
  buckets: SalesBucketDto[];

  @ApiProperty({ type: [SalesStoreDto], description: 'Every store, oldest first' })
  stores: SalesStoreDto[];

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ description: 'Orders in other currencies, which the report leaves out' })
  otherCurrencyOrders: number;

  static from(report: SalesReport): SalesReportDto {
    return Object.assign(new SalesReportDto(), report);
  }
}
