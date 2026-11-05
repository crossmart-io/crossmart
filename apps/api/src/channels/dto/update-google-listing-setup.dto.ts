import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { GoogleTargetCountry, PRODUCT_URL_HANDLE_PLACEHOLDER } from '@crossmart/connectors';
import type { GoogleListingSetupInput } from '@crossmart/core';
import {
  GOOGLE_TARGET_COUNTRY_SCHEMA_NAME,
  PRODUCT_URL_TEMPLATE_MAX_LENGTH,
} from '../channels.constants.js';

const HANDLE_PLACEHOLDER_PATTERN = /\{handle\}/;

export class UpdateGoogleListingSetupDto {
  @ApiProperty({
    enum: GoogleTargetCountry,
    enumName: GOOGLE_TARGET_COUNTRY_SCHEMA_NAME,
    description: 'Where listings sell; their currency and language follow',
  })
  @IsEnum(GoogleTargetCountry)
  country: GoogleTargetCountry;

  @ApiProperty({
    example: 'https://acme.example/products/{handle}',
    maxLength: PRODUCT_URL_TEMPLATE_MAX_LENGTH,
    description: `Each product’s page on the merchant’s website, with ${PRODUCT_URL_HANDLE_PLACEHOLDER} for its handle`,
  })
  @IsString()
  @MaxLength(PRODUCT_URL_TEMPLATE_MAX_LENGTH)
  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: false })
  @Matches(HANDLE_PLACEHOLDER_PATTERN, {
    message: `productUrlTemplate must contain ${PRODUCT_URL_HANDLE_PLACEHOLDER}`,
  })
  productUrlTemplate: string;

  toInput(): GoogleListingSetupInput {
    return { country: this.country, productUrlTemplate: this.productUrlTemplate.trim() };
  }
}
