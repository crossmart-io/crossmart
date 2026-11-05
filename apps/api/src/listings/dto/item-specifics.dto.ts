import {
  type CategoryAspect,
  CategoryAspectMode,
  CategoryAspectUsage,
  type ItemSpecific,
} from '@crossmart/connectors';
import {
  ITEM_SPECIFIC_NAME_MAX_LENGTH,
  ITEM_SPECIFIC_VALUE_MAX_LENGTH,
  ITEM_SPECIFIC_VALUES_MAX,
  ITEM_SPECIFICS_MAX,
  type ListingItemSpecificsView,
} from '@crossmart/core';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CATEGORY_ASPECT_MODE_SCHEMA_NAME,
  CATEGORY_ASPECT_USAGE_SCHEMA_NAME,
} from '../listings.constants.js';
import { ChannelCategoryDto } from './channel-category.dto.js';

/** An item specific set on a listing: an aspect name and its values. */
export class ItemSpecificDto implements ItemSpecific {
  @ApiProperty({ example: 'Material', maxLength: ITEM_SPECIFIC_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ITEM_SPECIFIC_NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    type: [String],
    example: ['Stoneware'],
    maxItems: ITEM_SPECIFIC_VALUES_MAX,
    description: 'Blank values are dropped; a specific left without values is removed',
  })
  @IsArray()
  @ArrayMaxSize(ITEM_SPECIFIC_VALUES_MAX)
  @IsString({ each: true })
  @MaxLength(ITEM_SPECIFIC_VALUE_MAX_LENGTH, { each: true })
  values: string[];

  static from(specific: ItemSpecific): ItemSpecificDto {
    return Object.assign(new ItemSpecificDto(), { name: specific.name, values: specific.values });
  }
}

/** The listing's item specifics; replaces every one set before. */
export class SaveItemSpecificsDto {
  @ApiProperty({ type: [ItemSpecificDto], maxItems: ITEM_SPECIFICS_MAX })
  @IsArray()
  @ArrayMaxSize(ITEM_SPECIFICS_MAX)
  @ValidateNested({ each: true })
  @Type(() => ItemSpecificDto)
  itemSpecifics: ItemSpecificDto[];
}

/** An item specific that listings in the category can have. */
export class CategoryAspectDto implements CategoryAspect {
  @ApiProperty({ example: 'Color' })
  name: string;

  @ApiProperty({ description: 'The channel refuses listings in the category without it' })
  required: boolean;

  @ApiProperty({ enum: CategoryAspectUsage, enumName: CATEGORY_ASPECT_USAGE_SCHEMA_NAME })
  usage: CategoryAspectUsage;

  @ApiProperty({
    enum: CategoryAspectMode,
    enumName: CATEGORY_ASPECT_MODE_SCHEMA_NAME,
    description: '`selection_only` takes one of `values`; `free_text` takes any text',
  })
  mode: CategoryAspectMode;

  @ApiProperty({ description: 'Whether a listing may give it several values' })
  multiple: boolean;

  @ApiProperty({ type: [String], description: 'The channel’s values, the first ones only' })
  values: string[];

  static from(aspect: CategoryAspect): CategoryAspectDto {
    return Object.assign(new CategoryAspectDto(), {
      name: aspect.name,
      required: aspect.required,
      usage: aspect.usage,
      mode: aspect.mode,
      multiple: aspect.multiple,
      values: aspect.values,
    });
  }
}

/** The listing's item specifics, with the ones its category asks for. */
export class ListingItemSpecificsDto {
  @ApiProperty({ type: ChannelCategoryDto, nullable: true })
  category: ChannelCategoryDto | null;

  @ApiProperty({
    type: [CategoryAspectDto],
    description: 'Required first, then recommended, then optional; none without a category',
  })
  aspects: CategoryAspectDto[];

  @ApiProperty({ type: [ItemSpecificDto] })
  itemSpecifics: ItemSpecificDto[];

  static from(view: ListingItemSpecificsView): ListingItemSpecificsDto {
    return Object.assign(new ListingItemSpecificsDto(), {
      category: ChannelCategoryDto.fromNullable(view.category),
      aspects: view.aspects.map((aspect) => CategoryAspectDto.from(aspect)),
      itemSpecifics: view.values.map((specific) => ItemSpecificDto.from(specific)),
    });
  }
}
