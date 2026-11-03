import { ApiProperty } from '@nestjs/swagger';
import type { InventoryMovementPage, InventoryMovementView } from '@crossmart/core';
import { InventoryMovementReason } from '@crossmart/database';
import { INVENTORY_MOVEMENT_REASON_SCHEMA_NAME } from '../inventory.constants.js';

export class InventoryMovementDto implements InventoryMovementView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Units added (positive) or removed (negative)' })
  delta: number;

  @ApiProperty({ enum: InventoryMovementReason, enumName: INVENTORY_MOVEMENT_REASON_SCHEMA_NAME })
  reason: InventoryMovementReason;

  @ApiProperty({ description: 'Stock on hand right after this movement' })
  quantityAfter: number;

  @ApiProperty({ type: String, nullable: true })
  note: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The user who made the change; null for API keys and changes made by Crossmart',
  })
  userName: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The API key that made the change, if any',
  })
  apiKeyName: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(movement: InventoryMovementView): InventoryMovementDto {
    return Object.assign(new InventoryMovementDto(), movement);
  }
}

export class InventoryMovementPageDto implements InventoryMovementPage {
  @ApiProperty({ type: [InventoryMovementDto] })
  items: InventoryMovementDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: InventoryMovementPage): InventoryMovementPageDto {
    return Object.assign(new InventoryMovementPageDto(), {
      items: page.items.map((item) => InventoryMovementDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
