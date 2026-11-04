import { ApiProperty } from '@nestjs/swagger';
import type { OrderDetail, OrderLineView, OrderPage, OrderSummary } from '@crossmart/core';
import { OrderStatus } from '@crossmart/database';
import { ORDER_STATUS_SCHEMA_NAME } from '../orders.constants.js';

export class OrderSummaryDto implements OrderSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '#1001', description: 'The number the merchant and buyer see' })
  name: string;

  @ApiProperty({ enum: OrderStatus, enumName: ORDER_STATUS_SCHEMA_NAME })
  status: OrderStatus;

  @ApiProperty({ example: 'USD' })
  currencyCode: string;

  @ApiProperty({ example: '130.00', description: 'What the buyer pays now' })
  total: string;

  @ApiProperty()
  placedAt: Date;

  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ example: 'Demo Store' })
  storeName: string;

  @ApiProperty({ example: 'shopify' })
  channel: string;

  @ApiProperty({ description: 'Units ordered, over every line' })
  itemCount: number;

  @ApiProperty({
    description: 'Lines that match no catalog variant, so their stock is not tracked',
  })
  unmatchedLines: number;

  static from(order: OrderSummary): OrderSummaryDto {
    return Object.assign(new OrderSummaryDto(), order);
  }
}

export class OrderLineDto implements OrderLineView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ example: '45.00' })
  unitPrice: string;

  @ApiProperty({ description: 'Units held for the order until they ship' })
  reservedQuantity: number;

  @ApiProperty({ description: 'Units shipped' })
  fulfilledQuantity: number;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  variantId: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  productId: string | null;
}

export class OrderDetailDto extends OrderSummaryDto implements OrderDetail {
  @ApiProperty({ description: 'The order’s id on its channel' })
  externalId: string;

  @ApiProperty({ type: [OrderLineDto] })
  lines: OrderLineDto[];

  static override from(order: OrderDetail): OrderDetailDto {
    return Object.assign(new OrderDetailDto(), order);
  }
}

export class OrderPageDto implements OrderPage {
  @ApiProperty({ type: [OrderSummaryDto] })
  items: OrderSummaryDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: OrderPage): OrderPageDto {
    return Object.assign(new OrderPageDto(), {
      items: page.items.map((item) => OrderSummaryDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
