import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, Matches, ValidateNested } from 'class-validator';
import {
  CompareAtMode,
  EXCHANGE_RATE_PATTERN,
  PriceRounding,
  type PricingFloor,
  type PricingRule,
} from '@crossmart/core';
import {
  COMPARE_AT_MODE_SCHEMA_NAME,
  PRICE_ROUNDING_SCHEMA_NAME,
  SIGNED_DECIMAL_PATTERN,
} from '../listings.constants.js';

const DECIMAL_MESSAGE = 'must be a decimal with at most two fraction digits, e.g. "15" or "-2.50"';

export class PricingFloorDto implements PricingFloor {
  @ApiProperty({
    example: '30',
    description: 'Never price below cost plus this percentage (0 to 1000)',
  })
  @Matches(SIGNED_DECIMAL_PATTERN, { message: `minMarginPercent ${DECIMAL_MESSAGE}` })
  minMarginPercent: string;

  static from(floor: PricingFloor): PricingFloorDto {
    return Object.assign(new PricingFloorDto(), floor);
  }
}

/**
 * How a connection prices variants without a manual price: the variant's price moved by
 * `adjustmentPercent`, plus `fixedAmount`, rounded up as `rounding` says, then raised to the
 * floor when below it.
 */
export class PricingRuleDto implements PricingRule {
  @ApiProperty({
    example: '15',
    description: 'Markup (positive) or discount (negative), -90 to 500',
  })
  @Matches(SIGNED_DECIMAL_PATTERN, { message: `adjustmentPercent ${DECIMAL_MESSAGE}` })
  adjustmentPercent: string;

  @ApiProperty({ example: '0', description: 'Added after the percentage; may be negative' })
  @Matches(SIGNED_DECIMAL_PATTERN, { message: `fixedAmount ${DECIMAL_MESSAGE}` })
  fixedAmount: string;

  @ApiProperty({ enum: PriceRounding, enumName: PRICE_ROUNDING_SCHEMA_NAME })
  @IsEnum(PriceRounding)
  rounding: PriceRounding;

  @ApiProperty({ type: PricingFloorDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingFloorDto)
  floor: PricingFloorDto | null;

  @ApiProperty({ enum: CompareAtMode, enumName: COMPARE_AT_MODE_SCHEMA_NAME })
  @IsEnum(CompareAtMode)
  compareAt: CompareAtMode;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '0.92',
    description:
      'Store-currency units per catalog-currency unit, used instead of the ECB daily rate. ' +
      'Only applies when the store sells in another currency than the workspace.',
  })
  @IsOptional()
  @Matches(EXCHANGE_RATE_PATTERN, {
    message: 'fixedExchangeRate must be a positive decimal with at most six fraction digits',
  })
  fixedExchangeRate?: string | null;

  static from(rule: PricingRule): PricingRuleDto {
    return Object.assign(new PricingRuleDto(), {
      ...rule,
      floor: rule.floor ? PricingFloorDto.from(rule.floor) : null,
    });
  }

  toRule(): PricingRule {
    return {
      adjustmentPercent: this.adjustmentPercent,
      fixedAmount: this.fixedAmount,
      rounding: this.rounding,
      floor: this.floor ? { minMarginPercent: this.floor.minMarginPercent } : null,
      compareAt: this.compareAt,
      fixedExchangeRate: this.fixedExchangeRate ?? null,
    };
  }
}

export class UpdatePricingDto {
  @ApiProperty({
    type: PricingRuleDto,
    nullable: true,
    description: 'The rule; null removes it, so catalog prices are sent as they are',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingRuleDto)
  rule: PricingRuleDto | null;
}
