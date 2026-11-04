import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BulkProductAction,
  type BulkProductChange,
  type BulkProductResult,
  MAX_BULK_PRODUCTS,
  MAX_BULK_TAGS,
  MAX_PRICE_ADJUSTMENT_PERCENT,
  MIN_PRICE_ADJUSTMENT_PERCENT,
} from '@crossmart/core';
import { ProductStatus } from '@crossmart/database';
import {
  BULK_PRODUCT_ACTION_SCHEMA_NAME,
  PRODUCT_STATUS_SCHEMA_NAME,
  PRODUCT_TEXT_MAX_LENGTH,
} from '../catalog.constants.js';

const TAG_ACTIONS: readonly BulkProductAction[] = [
  BulkProductAction.AddTags,
  BulkProductAction.RemoveTags,
];
const PERCENT_DECIMALS = 2;

/** One change for many products. Each action requires its own field and ignores the others. */
export class BulkProductActionDto {
  @ApiProperty({ type: [String], format: 'uuid', maxItems: MAX_BULK_PRODUCTS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_PRODUCTS)
  @IsUUID('all', { each: true })
  productIds: string[];

  @ApiProperty({ enum: BulkProductAction, enumName: BULK_PRODUCT_ACTION_SCHEMA_NAME })
  @IsEnum(BulkProductAction)
  action: BulkProductAction;

  @ApiPropertyOptional({
    enum: ProductStatus,
    enumName: PRODUCT_STATUS_SCHEMA_NAME,
    description: 'Required for `set_status`',
  })
  @ValidateIf((body: BulkProductActionDto) => body.action === BulkProductAction.SetStatus)
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [String], description: 'Required for `add_tags` and `remove_tags`' })
  @ValidateIf((body: BulkProductActionDto) => TAG_ACTIONS.includes(body.action))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_TAGS)
  @IsString({ each: true })
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    minimum: MIN_PRICE_ADJUSTMENT_PERCENT,
    maximum: MAX_PRICE_ADJUSTMENT_PERCENT,
    description:
      'Required for `adjust_prices`. 10 raises every price by 10%, -15 lowers it by 15%.',
  })
  @ValidateIf((body: BulkProductActionDto) => body.action === BulkProductAction.AdjustPrices)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: PERCENT_DECIMALS })
  @Min(MIN_PRICE_ADJUSTMENT_PERCENT)
  @Max(MAX_PRICE_ADJUSTMENT_PERCENT)
  percent?: number;

  /** Validation has made sure the field the action needs is present. */
  toChange(): BulkProductChange {
    switch (this.action) {
      case BulkProductAction.SetStatus:
        return { action: this.action, status: this.status ?? ProductStatus.DRAFT };
      case BulkProductAction.AddTags:
      case BulkProductAction.RemoveTags:
        return { action: this.action, tags: this.tags ?? [] };
      case BulkProductAction.AdjustPrices:
        return { action: this.action, percent: this.percent ?? 0 };
      case BulkProductAction.Delete:
        return { action: this.action };
    }
  }
}

export class BulkProductResultDto implements BulkProductResult {
  @ApiProperty({ description: 'Products changed. Ids from other workspaces are not counted.' })
  affected: number;

  static from(result: BulkProductResult): BulkProductResultDto {
    return Object.assign(new BulkProductResultDto(), result);
  }
}
