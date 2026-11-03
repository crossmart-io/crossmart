import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import {
  SELECTION_PREVIEW_DEFAULT_LIMIT,
  SELECTION_PREVIEW_MAX_LIMIT,
  type SelectionPreview,
  type SelectionPreviewQuery,
  type SelectionImpact,
} from '@crossmart/core';
import { ProductSummaryDto } from '../../catalog/dto/product-summary.dto.js';
import { ProductSelectionRuleDto } from '../../channels/dto/channel-settings.dto.js';

export class UpdateProductSelectionDto {
  @ApiProperty({
    type: ProductSelectionRuleDto,
    nullable: true,
    description: 'The selection; null lists every product',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSelectionRuleDto)
  rule: ProductSelectionRuleDto | null;
}

export class SelectionPreviewQueryDto implements SelectionPreviewQuery {
  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: SELECTION_PREVIEW_MAX_LIMIT,
    default: SELECTION_PREVIEW_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SELECTION_PREVIEW_MAX_LIMIT)
  limit: number = SELECTION_PREVIEW_DEFAULT_LIMIT;
}

export class SelectionPreviewDto implements SelectionPreview, SelectionImpact {
  @ApiProperty({ description: 'Products the selection lists' })
  total: number;

  @ApiProperty({ description: 'Products the filter matches, before the manual lists' })
  matchingFilter: number;

  @ApiProperty({ description: 'Products added by hand that the filter does not match' })
  addedManually: number;

  @ApiProperty({ description: 'Products the filter matches that were removed by hand' })
  removedManually: number;

  @ApiProperty({ type: [ProductSummaryDto] })
  items: ProductSummaryDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty({ description: 'Products saving this rule publishes now' })
  toPublish: number;

  @ApiProperty({ description: 'Products saving this rule delists now' })
  toRemove: number;

  static from(preview: SelectionPreview, impact: SelectionImpact): SelectionPreviewDto {
    return Object.assign(new SelectionPreviewDto(), {
      ...preview,
      ...impact,
      items: preview.items.map((item) => ProductSummaryDto.from(item)),
    });
  }
}
