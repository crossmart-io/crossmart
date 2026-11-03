import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AMOUNT_PATTERN, normalizeAmount } from '@crossmart/common';
import type {
  ListingOverrideInput,
  ListingOverrideView,
  VariantPriceOverrideInput,
} from '@crossmart/core';
import { ListingVisibility } from '@crossmart/database';
import {
  LISTING_VISIBILITY_SCHEMA_NAME,
  MAX_SHOWN_QUANTITY,
  OVERRIDE_DESCRIPTION_MAX_LENGTH,
  OVERRIDE_MAX_ITEMS,
  OVERRIDE_TEXT_MAX_LENGTH,
} from '../listings.constants.js';

const AMOUNT_MESSAGE = 'must be a non-negative amount with at most two decimals, e.g. "19.90"';
const URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };

function amountOrNull(value: string | null | undefined): string | null {
  return value ? (normalizeAmount(value) ?? value) : null;
}

export class VariantPriceOverrideDto implements VariantPriceOverrideInput {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ type: String, nullable: true, example: '79.00' })
  @IsOptional()
  @Matches(AMOUNT_PATTERN, { message: `price ${AMOUNT_MESSAGE}` })
  price: string | null;

  @ApiProperty({ type: String, nullable: true, example: '99.00' })
  @IsOptional()
  @Matches(AMOUNT_PATTERN, { message: `compareAtPrice ${AMOUNT_MESSAGE}` })
  compareAtPrice: string | null;
}

/** What this listing shows differently from the product. Null or absent fields follow it. */
export class ListingOverrideDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: OVERRIDE_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(OVERRIDE_TEXT_MAX_LENGTH)
  title?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(OVERRIDE_DESCRIPTION_MAX_LENGTH)
  descriptionHtml?: string | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'Replaces the product’s tags',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(OVERRIDE_MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(OVERRIDE_TEXT_MAX_LENGTH, { each: true })
  tags?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'The product’s image URLs to show, in order',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(OVERRIDE_MAX_ITEMS)
  @IsUrl(URL_OPTIONS, { each: true })
  mediaUrls?: string[] | null;

  @ApiPropertyOptional({
    enum: ListingVisibility,
    enumName: LISTING_VISIBILITY_SCHEMA_NAME,
    nullable: true,
    description: 'Show or hide on this channel, whatever the product’s status',
  })
  @IsOptional()
  @IsEnum(ListingVisibility)
  visibility?: ListingVisibility | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0, description: 'Units held back' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_SHOWN_QUANTITY)
  inventoryBuffer?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    description: 'Most units shown',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_SHOWN_QUANTITY)
  maxQuantity?: number | null;

  @ApiPropertyOptional({ type: [VariantPriceOverrideDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(OVERRIDE_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => VariantPriceOverrideDto)
  variantPrices?: VariantPriceOverrideDto[];

  toInput(): ListingOverrideInput {
    const title = this.title?.trim();
    return {
      title: title ? title : null,
      descriptionHtml: this.descriptionHtml ?? null,
      tags: this.tags ? [...new Set(this.tags.map((tag) => tag.trim()).filter(Boolean))] : null,
      mediaUrls: this.mediaUrls ?? null,
      visibility: this.visibility ?? null,
      inventoryBuffer: this.inventoryBuffer ?? null,
      maxQuantity: this.maxQuantity ?? null,
      variantPrices: (this.variantPrices ?? []).map((entry) => ({
        variantId: entry.variantId,
        price: amountOrNull(entry.price),
        compareAtPrice: amountOrNull(entry.compareAtPrice),
      })),
    };
  }
}

export class ListingOverrideViewDto implements ListingOverrideView {
  @ApiProperty({ type: String, nullable: true })
  title: string | null;

  @ApiProperty({ type: String, nullable: true })
  descriptionHtml: string | null;

  @ApiProperty({ type: [String], nullable: true })
  tags: string[] | null;

  @ApiProperty({ type: [String], nullable: true })
  mediaUrls: string[] | null;

  @ApiProperty({
    enum: ListingVisibility,
    enumName: LISTING_VISIBILITY_SCHEMA_NAME,
    nullable: true,
  })
  visibility: ListingVisibility | null;

  @ApiProperty({ type: Number, nullable: true })
  inventoryBuffer: number | null;

  @ApiProperty({ type: Number, nullable: true })
  maxQuantity: number | null;

  @ApiProperty({ type: [VariantPriceOverrideDto] })
  variantPrices: VariantPriceOverrideDto[];

  @ApiProperty()
  updatedAt: Date;

  static from(view: ListingOverrideView): ListingOverrideViewDto {
    return Object.assign(new ListingOverrideViewDto(), {
      ...view,
      variantPrices: view.variantPrices.map((entry) =>
        Object.assign(new VariantPriceOverrideDto(), entry),
      ),
    });
  }
}
