import { ApiProperty } from '@nestjs/swagger';
import { CatalogGap, type CatalogGapCount, type CatalogStats } from '@crossmart/core';
import { CATALOG_GAP_SCHEMA_NAME } from '../catalog.constants.js';

export class CatalogGapCountDto implements CatalogGapCount {
  @ApiProperty({ enum: CatalogGap, enumName: CATALOG_GAP_SCHEMA_NAME })
  gap: CatalogGap;

  @ApiProperty({ description: 'Products with this gap' })
  products: number;
}

export class CatalogStatsDto implements CatalogStats {
  @ApiProperty()
  products: number;

  @ApiProperty()
  activeProducts: number;

  @ApiProperty()
  draftProducts: number;

  @ApiProperty()
  archivedProducts: number;

  @ApiProperty()
  variants: number;

  @ApiProperty({ description: 'Tracked variants with nothing available' })
  outOfStockVariants: number;

  @ApiProperty({
    type: [CatalogGapCountDto],
    description: 'Products lacking what channels require',
  })
  gaps: CatalogGapCountDto[];

  static from(stats: CatalogStats): CatalogStatsDto {
    return Object.assign(new CatalogStatsDto(), stats);
  }
}
