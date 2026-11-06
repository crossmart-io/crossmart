import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AMOUNT_PATTERN, normalizeAmount } from '@crossmart/common';
import {
  defaultProductHandle,
  MAX_PRODUCT_OPTIONS,
  MAX_VARIANTS_PER_PRODUCT,
  type MediaDraft,
  type ProductDraft,
  type VariantDraft,
} from '@crossmart/core';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import {
  OUT_OF_STOCK_POLICY_SCHEMA_NAME,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_HANDLE_MAX_LENGTH,
  PRODUCT_MEDIA_MAX,
  PRODUCT_STATUS_SCHEMA_NAME,
  PRODUCT_TAGS_MAX,
  PRODUCT_TEXT_MAX_LENGTH,
  PRODUCT_TITLE_MAX_LENGTH,
} from '../catalog.constants.js';

const AMOUNT_MESSAGE = 'must be a non-negative amount with at most two decimals, e.g. "19.90"';
// Self-hosted installs serve images from hosts without a public TLD (localhost, intranet names).
const WEB_URL_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
};

/** Validated amounts always normalize; the fallback only satisfies the type checker. */
function toAmount(value: string): string {
  return normalizeAmount(value) ?? value;
}

/** Everything about a variant except its stock, shared by create and update. */
export abstract class VariantFieldsDto {
  @ApiPropertyOptional({ maxLength: PRODUCT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH)
  sku?: string;

  @ApiPropertyOptional({ description: 'GTIN, UPC, EAN or ISBN' })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH)
  barcode?: string;

  @ApiPropertyOptional({ type: [String], description: 'One value per product option, in order' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRODUCT_OPTIONS)
  @IsString({ each: true })
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH, { each: true })
  optionValues: string[] = [];

  @ApiProperty({ example: '19.90' })
  @Matches(AMOUNT_PATTERN, { message: `price ${AMOUNT_MESSAGE}` })
  price: string;

  @ApiPropertyOptional({ example: '24.90' })
  @IsOptional()
  @Matches(AMOUNT_PATTERN, { message: `compareAtPrice ${AMOUNT_MESSAGE}` })
  compareAtPrice?: string;

  @ApiPropertyOptional({
    example: '40.00',
    description: 'What you pay per unit. Used for pricing floors; never shown to buyers.',
  })
  @IsOptional()
  @Matches(AMOUNT_PATTERN, { message: `cost ${AMOUNT_MESSAGE}` })
  cost?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresShipping: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  taxable: boolean = true;

  @ApiPropertyOptional({
    enum: OutOfStockPolicy,
    enumName: OUT_OF_STOCK_POLICY_SCHEMA_NAME,
    default: OutOfStockPolicy.STOP_SELLING,
  })
  @IsOptional()
  @IsEnum(OutOfStockPolicy)
  outOfStockPolicy: OutOfStockPolicy = OutOfStockPolicy.STOP_SELLING;

  @ApiPropertyOptional({ default: true, description: 'Track stock for this variant' })
  @IsOptional()
  @IsBoolean()
  tracked: boolean = true;

  protected toDraftWith(quantity: number | undefined): VariantDraft {
    return {
      sku: this.sku,
      barcode: this.barcode,
      optionValues: this.optionValues,
      price: toAmount(this.price),
      compareAtPrice: this.compareAtPrice ? toAmount(this.compareAtPrice) : undefined,
      cost: this.cost ? toAmount(this.cost) : undefined,
      weightGrams: this.weightGrams,
      requiresShipping: this.requiresShipping,
      taxable: this.taxable,
      outOfStockPolicy: this.outOfStockPolicy,
      inventory: { tracked: this.tracked, quantity },
    };
  }
}

export class CreateVariantDto extends VariantFieldsDto {
  @ApiPropertyOptional({ default: 0, description: 'Opening stock' })
  @IsOptional()
  @IsInt()
  quantity: number = 0;

  toDraft(): VariantDraft {
    return this.toDraftWith(this.quantity);
  }
}

export class CreateMediaDto implements MediaDraft {
  @ApiProperty({ example: 'https://cdn.example.com/mug.jpg' })
  @IsUrl(WEB_URL_OPTIONS)
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH)
  altText?: string;
}

/** Everything about a product except its handle and variants, shared by create and update. */
export abstract class ProductContentDto {
  @ApiProperty({ maxLength: PRODUCT_TITLE_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  descriptionHtml: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH)
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH)
  productType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_TAGS_MAX)
  @IsString({ each: true })
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH, { each: true })
  tags: string[] = [];

  @ApiPropertyOptional({
    enum: ProductStatus,
    enumName: PRODUCT_STATUS_SCHEMA_NAME,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status: ProductStatus = ProductStatus.DRAFT;

  @ApiPropertyOptional({ type: [String], example: ['Size', 'Color'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRODUCT_OPTIONS)
  @IsString({ each: true })
  @MaxLength(PRODUCT_TEXT_MAX_LENGTH, { each: true })
  optionNames: string[] = [];

  @ApiPropertyOptional({ type: [CreateMediaDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_MEDIA_MAX)
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto)
  media: CreateMediaDto[] = [];

  protected toDraftWith(handle: string, variants: VariantDraft[]): ProductDraft {
    return {
      handle,
      title: this.title,
      descriptionHtml: this.descriptionHtml,
      vendor: this.vendor,
      productType: this.productType,
      tags: this.tags,
      status: this.status,
      optionNames: this.optionNames,
      variants,
      media: this.media.map(({ url, altText }) => ({ url, altText })),
    };
  }
}

export class CreateProductDto extends ProductContentDto {
  @ApiPropertyOptional({
    maxLength: PRODUCT_HANDLE_MAX_LENGTH,
    description:
      'Unique in the workspace. Defaults to the slugified title, or to `product-<random id>` ' +
      'when the title has no Latin letters or digits (such as a Hebrew title).',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PRODUCT_HANDLE_MAX_LENGTH)
  handle?: string;

  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_VARIANTS_PER_PRODUCT)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];

  toDraft(): ProductDraft {
    return this.toDraftWith(
      this.handle ?? defaultProductHandle(this.title),
      this.variants.map((variant) => variant.toDraft()),
    );
  }
}
