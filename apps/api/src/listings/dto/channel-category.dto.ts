import type { ChannelCategory } from '@crossmart/connectors';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CATEGORY_ID_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
  CATEGORY_QUERY_MAX_LENGTH,
} from '../listings.constants.js';

/** A category on a channel's taxonomy, such as an eBay leaf category. */
export class ChannelCategoryDto implements ChannelCategory {
  @ApiProperty({ example: '20625' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_ID_MAX_LENGTH)
  id: string;

  @ApiProperty({
    example: 'Home & Garden > Kitchen, Dining & Bar > Dinnerware & Serving Dishes > Mugs',
    description: 'The category with its ancestors, as the channel shows it',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  name: string;

  static from(category: ChannelCategory): ChannelCategoryDto {
    return Object.assign(new ChannelCategoryDto(), { id: category.id, name: category.name });
  }

  static fromNullable(category: ChannelCategory | null): ChannelCategoryDto | null {
    return category ? ChannelCategoryDto.from(category) : null;
  }
}

/** The category to list the product in on the channel; null lets the next publish pick one. */
export class ChooseChannelCategoryDto {
  @ApiProperty({ type: ChannelCategoryDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelCategoryDto)
  category: ChannelCategoryDto | null;
}

export class CategorySuggestionsQueryDto {
  @ApiPropertyOptional({ description: 'Keywords; the product’s title when absent' })
  @IsOptional()
  @IsString()
  @MaxLength(CATEGORY_QUERY_MAX_LENGTH)
  search?: string;
}
