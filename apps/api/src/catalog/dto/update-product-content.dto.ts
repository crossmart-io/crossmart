import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { ProductContentPatch } from '@crossmart/core';
import { PRODUCT_DESCRIPTION_MAX_LENGTH, PRODUCT_TITLE_MAX_LENGTH } from '../catalog.constants.js';

/** Send only what changes: the title, the description, or both. */
export class UpdateProductContentDto implements ProductContentPatch {
  @ApiPropertyOptional({
    maxLength: PRODUCT_TITLE_MAX_LENGTH,
    example: 'Linen Shirt – Relaxed Fit',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(PRODUCT_TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH,
    description: 'HTML; unsafe markup is removed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  descriptionHtml?: string;
}
