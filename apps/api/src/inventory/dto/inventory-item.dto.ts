import { ApiProperty } from '@nestjs/swagger';
import { type InventoryPage, type InventoryRow, StockLevel } from '@crossmart/core';
import { STOCK_LEVEL_SCHEMA_NAME } from '../inventory.constants.js';

export class InventoryItemDto implements InventoryRow {
  @ApiProperty({ format: 'uuid' })
  inventoryItemId: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty({ type: [String], description: 'One value per product option, in order' })
  optionValues: string[];

  @ApiProperty({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The product’s first image' })
  imageUrl: string | null;

  @ApiProperty({ description: 'Whether Crossmart tracks stock for this variant' })
  tracked: boolean;

  @ApiProperty({ description: 'Units in stock: available plus reserved' })
  onHand: number;

  @ApiProperty({ description: 'Units held for open orders' })
  reserved: number;

  @ApiProperty({ description: 'Units that can still be sold, and what channels receive' })
  available: number;

  @ApiProperty({ enum: StockLevel, enumName: STOCK_LEVEL_SCHEMA_NAME })
  stockLevel: StockLevel;

  @ApiProperty()
  updatedAt: Date;

  static from(row: InventoryRow): InventoryItemDto {
    return Object.assign(new InventoryItemDto(), row);
  }
}

export class InventoryPageDto implements InventoryPage {
  @ApiProperty({ type: [InventoryItemDto] })
  items: InventoryItemDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: InventoryPage): InventoryPageDto {
    return Object.assign(new InventoryPageDto(), {
      items: page.items.map((item) => InventoryItemDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
