import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { EbayCondition, type EbayListingDefaults, type EbayShipFrom } from '@crossmart/connectors';
import type { EbayListingDefaultsInput } from '@crossmart/core';
import {
  CITY_MAX_LENGTH,
  COUNTRY_CODE_PATTERN,
  EBAY_CONDITION_SCHEMA_NAME,
  POLICY_ID_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
} from '../channels.constants.js';

/** Where the merchant's items ship from. */
export class EbayShipFromDto implements EbayShipFrom {
  @ApiProperty({ example: '95125' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(POSTAL_CODE_MAX_LENGTH)
  postalCode: string;

  @ApiProperty({ example: 'US', description: 'ISO 3166 alpha-2 country code' })
  @Matches(COUNTRY_CODE_PATTERN, { message: 'country must be an ISO 3166 alpha-2 code, e.g. US' })
  country: string;

  @ApiProperty({ type: String, nullable: true, example: 'San Jose' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CITY_MAX_LENGTH)
  city: string | null;

  static from(shipFrom: EbayShipFrom): EbayShipFromDto {
    return Object.assign(new EbayShipFromDto(), shipFrom);
  }
}

/** What every listing on an eBay connection is sold under. */
export class UpdateEbayListingDefaultsDto implements EbayListingDefaultsInput {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Shipping policy; null uses the account’s only one, when it has exactly one',
  })
  @IsOptional()
  @IsString()
  @MaxLength(POLICY_ID_MAX_LENGTH)
  fulfillmentPolicyId: string | null;

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(POLICY_ID_MAX_LENGTH)
  paymentPolicyId: string | null;

  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(POLICY_ID_MAX_LENGTH)
  returnPolicyId: string | null;

  @ApiProperty({ enum: EbayCondition, enumName: EBAY_CONDITION_SCHEMA_NAME })
  @IsEnum(EbayCondition)
  condition: EbayCondition;

  @ApiProperty({
    type: EbayShipFromDto,
    nullable: true,
    description: 'Saved on eBay as the account’s Crossmart inventory location',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EbayShipFromDto)
  location: EbayShipFromDto | null;

  toInput(): EbayListingDefaultsInput {
    return {
      fulfillmentPolicyId: this.fulfillmentPolicyId ?? null,
      paymentPolicyId: this.paymentPolicyId ?? null,
      returnPolicyId: this.returnPolicyId ?? null,
      condition: this.condition,
      location: this.location
        ? {
            postalCode: this.location.postalCode,
            country: this.location.country,
            city: this.location.city ?? null,
          }
        : null,
    };
  }
}

/**
 * The defaults listings are published with: each policy is the merchant's choice, or the
 * account's only one of its type; null until one is chosen.
 */
export class EbayListingDefaultsDto implements EbayListingDefaults {
  @ApiProperty({ type: String, nullable: true })
  fulfillmentPolicyId: string | null;

  @ApiProperty({ type: String, nullable: true })
  paymentPolicyId: string | null;

  @ApiProperty({ type: String, nullable: true })
  returnPolicyId: string | null;

  @ApiProperty({ enum: EbayCondition, enumName: EBAY_CONDITION_SCHEMA_NAME })
  condition: EbayCondition;

  @ApiProperty({ type: EbayShipFromDto, nullable: true })
  location: EbayShipFromDto | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The inventory location Crossmart created on eBay for `location`',
  })
  merchantLocationKey: string | null;

  static from(defaults: EbayListingDefaults): EbayListingDefaultsDto {
    return Object.assign(new EbayListingDefaultsDto(), {
      ...defaults,
      location: defaults.location ? EbayShipFromDto.from(defaults.location) : null,
    });
  }
}
