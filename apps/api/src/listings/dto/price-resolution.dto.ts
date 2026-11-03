import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import {
  type PriceStep,
  PriceSource,
  PriceStepKind,
  PriceWarning,
  type PricingPreview,
  type PricingPreviewVariant,
  type ResolvedPrice,
} from '@crossmart/core';
import {
  PRICE_SOURCE_SCHEMA_NAME,
  PRICE_STEP_KIND_SCHEMA_NAME,
  PRICE_WARNING_SCHEMA_NAME,
} from '../listings.constants.js';
import { PricingRuleDto } from './pricing-rule.dto.js';

export class PriceStepDto implements PriceStep {
  @ApiProperty({ enum: PriceStepKind, enumName: PRICE_STEP_KIND_SCHEMA_NAME })
  kind: PriceStepKind;

  @ApiProperty({ example: '+15%' })
  label: string;

  @ApiProperty({ example: '102.35', description: 'The price after this step' })
  amount: string;
}

/** A channel price and how it was reached. */
export class ResolvedPriceDto implements ResolvedPrice {
  @ApiProperty({ example: '102.99' })
  price: string;

  @ApiProperty({ type: String, nullable: true })
  compareAtPrice: string | null;

  @ApiProperty({ enum: PriceSource, enumName: PRICE_SOURCE_SCHEMA_NAME })
  source: PriceSource;

  @ApiProperty({ type: [PriceStepDto] })
  steps: PriceStepDto[];

  @ApiProperty({ example: '$89.00 → +15% → .99 = $102.99' })
  explanation: string;

  @ApiProperty({ enum: PriceWarning, enumName: PRICE_WARNING_SCHEMA_NAME, isArray: true })
  warnings: PriceWarning[];

  static from(resolved: ResolvedPrice): ResolvedPriceDto {
    return Object.assign(new ResolvedPriceDto(), {
      ...resolved,
      steps: resolved.steps.map((step) => Object.assign(new PriceStepDto(), step)),
    });
  }
}

export class PricingPreviewRequestDto {
  @ApiProperty({
    type: PricingRuleDto,
    nullable: true,
    description: 'The rule to try, saved or not; null shows catalog prices',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingRuleDto)
  rule: PricingRuleDto | null;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'The product to price; defaults to the first selected product',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class PricingPreviewProductDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;
}

export class PricingPreviewVariantDto implements PricingPreviewVariant {
  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty({ example: 'Blue / Large' })
  title: string;

  @ApiProperty({ example: '89.00' })
  basePrice: string;

  @ApiProperty({ type: String, nullable: true })
  cost: string | null;

  @ApiProperty({ type: ResolvedPriceDto })
  resolved: ResolvedPriceDto;
}

export class PricingPreviewDto implements PricingPreview {
  @ApiProperty({ example: 'USD' })
  currencyCode: string;

  @ApiProperty({ type: PricingPreviewProductDto, nullable: true })
  product: PricingPreviewProductDto | null;

  @ApiProperty({ type: [PricingPreviewVariantDto] })
  variants: PricingPreviewVariantDto[];

  static from(preview: PricingPreview): PricingPreviewDto {
    return Object.assign(new PricingPreviewDto(), {
      ...preview,
      product: preview.product
        ? Object.assign(new PricingPreviewProductDto(), preview.product)
        : null,
      variants: preview.variants.map((variant) =>
        Object.assign(new PricingPreviewVariantDto(), {
          ...variant,
          resolved: ResolvedPriceDto.from(variant.resolved),
        }),
      ),
    });
  }
}
