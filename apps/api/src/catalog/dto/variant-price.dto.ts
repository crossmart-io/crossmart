import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches, ValidateIf } from 'class-validator';
import { AMOUNT_PATTERN } from '@crossmart/common';
import type { VariantPricePatch, VariantRef } from '@crossmart/core';

const AMOUNT_MESSAGE = 'must be a non-negative amount with at most two decimals, e.g. "19.90"';

/** The route parameters that name one variant of a product in a workspace. */
export class VariantParamsDto implements VariantRef {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variantId: string;
}

/** Send only what changes: the price, the compare-at price, or both. */
export class UpdateVariantPriceDto implements VariantPricePatch {
  @ApiPropertyOptional({ example: '19.90', description: 'In the workspace currency' })
  @IsOptional()
  @Matches(AMOUNT_PATTERN, { message: `price ${AMOUNT_MESSAGE}` })
  price?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '24.90',
    description: 'The "was" price buyers see struck through; null removes it',
  })
  @ValidateIf((_dto, value) => value !== null && value !== undefined)
  @Matches(AMOUNT_PATTERN, { message: `compareAtPrice ${AMOUNT_MESSAGE}` })
  compareAtPrice?: string | null;
}
