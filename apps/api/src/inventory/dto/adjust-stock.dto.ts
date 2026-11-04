import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  type Actor,
  MANUAL_MOVEMENT_REASONS,
  MAX_STOCK_QUANTITY,
  MOVEMENT_NOTE_MAX_LENGTH,
  type StockAdjustment,
  StockAdjustmentMode,
} from '@crossmart/core';
import { InventoryMovementReason } from '@crossmart/database';
import {
  INVENTORY_MOVEMENT_REASON_SCHEMA_NAME,
  STOCK_ADJUSTMENT_MODE_SCHEMA_NAME,
} from '../inventory.constants.js';

export class AdjustStockDto {
  @ApiProperty({ enum: StockAdjustmentMode, enumName: STOCK_ADJUSTMENT_MODE_SCHEMA_NAME })
  @IsEnum(StockAdjustmentMode)
  mode: StockAdjustmentMode;

  @ApiProperty({
    minimum: -MAX_STOCK_QUANTITY,
    maximum: MAX_STOCK_QUANTITY,
    description:
      'With `delta`, units to add (or remove, when negative). With `set`, the new stock on hand.',
  })
  @IsInt()
  @Min(-MAX_STOCK_QUANTITY)
  @Max(MAX_STOCK_QUANTITY)
  quantity: number;

  @ApiProperty({
    enum: InventoryMovementReason,
    enumName: INVENTORY_MOVEMENT_REASON_SCHEMA_NAME,
    description: `One of ${MANUAL_MOVEMENT_REASONS.join(', ')}. The other reasons are recorded by Crossmart.`,
  })
  @IsIn(MANUAL_MOVEMENT_REASONS)
  reason: InventoryMovementReason;

  @ApiPropertyOptional({ maxLength: MOVEMENT_NOTE_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MOVEMENT_NOTE_MAX_LENGTH)
  note?: string;

  toAdjustment(actor: Actor): StockAdjustment {
    return {
      mode: this.mode,
      quantity: this.quantity,
      reason: this.reason,
      note: this.note?.trim() || undefined,
      actor,
    };
  }
}
