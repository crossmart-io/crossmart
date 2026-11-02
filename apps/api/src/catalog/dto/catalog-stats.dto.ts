import { ApiProperty } from '@nestjs/swagger';
import type { CatalogStats } from '@crossmart/core';

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

  static from(stats: CatalogStats): CatalogStatsDto {
    return Object.assign(new CatalogStatsDto(), stats);
  }
}
