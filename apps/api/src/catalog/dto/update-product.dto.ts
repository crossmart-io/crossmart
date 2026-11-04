import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_VARIANTS_PER_PRODUCT, type ProductDraft, type VariantDraft } from '@crossmart/core';
import { PRODUCT_HANDLE_MAX_LENGTH } from '../catalog.constants.js';
import { CreateVariantDto, ProductContentDto } from './create-product.dto.js';

export class UpdateVariantDto extends CreateVariantDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'The variant to edit. Leave empty to add a new variant.',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  override toDraft(): VariantDraft {
    return { ...super.toDraft(), id: this.id };
  }
}

/**
 * The full product. Variants sent with an `id` are edited, new ones are added, and variants
 * left out are removed. `quantity` is the stock on hand; changes are logged as adjustments.
 */
export class UpdateProductDto extends ProductContentDto {
  @ApiProperty({ maxLength: PRODUCT_HANDLE_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_HANDLE_MAX_LENGTH)
  handle: string;

  @ApiProperty({ type: [UpdateVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VARIANTS_PER_PRODUCT)
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants: UpdateVariantDto[];

  toDraft(): ProductDraft {
    return this.toDraftWith(
      this.handle,
      this.variants.map((variant) => variant.toDraft()),
    );
  }
}
