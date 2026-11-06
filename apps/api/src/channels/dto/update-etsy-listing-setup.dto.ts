import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { EtsyWhenMade, EtsyWhoMade } from '@crossmart/connectors';
import type { EtsyListingSetupInput } from '@crossmart/core';
import {
  ETSY_PROFILE_ID_PATTERN,
  ETSY_WHEN_MADE_SCHEMA_NAME,
  ETSY_WHO_MADE_SCHEMA_NAME,
} from '../channels.constants.js';

export class UpdateEtsyListingSetupDto {
  @ApiProperty({
    enum: EtsyWhoMade,
    enumName: ETSY_WHO_MADE_SCHEMA_NAME,
    description: 'Who made the items',
  })
  @IsEnum(EtsyWhoMade)
  whoMade: EtsyWhoMade;

  @ApiProperty({
    enum: EtsyWhenMade,
    enumName: ETSY_WHEN_MADE_SCHEMA_NAME,
    description: 'When the items were made: `made_to_order`, or an era for vintage items',
  })
  @IsEnum(EtsyWhenMade)
  whenMade: EtsyWhenMade;

  @ApiProperty({
    description: 'Whether the items are craft supplies rather than finished products',
  })
  @IsBoolean()
  isSupply: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '6722757781',
    description: 'One of the shop’s shipping profiles; null follows the shop’s only one',
  })
  @IsOptional()
  @IsString()
  @Matches(ETSY_PROFILE_ID_PATTERN)
  shippingProfileId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '18201076875',
    description: 'One of the shop’s processing profiles; null follows the shop’s only one',
  })
  @IsOptional()
  @IsString()
  @Matches(ETSY_PROFILE_ID_PATTERN)
  processingProfileId: string | null;

  toInput(): EtsyListingSetupInput {
    return {
      whoMade: this.whoMade,
      whenMade: this.whenMade,
      isSupply: this.isSupply,
      shippingProfileId: this.shippingProfileId ?? null,
      processingProfileId: this.processingProfileId ?? null,
    };
  }
}
