import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsUUID } from 'class-validator';
import { STORE_MEMBERSHIP_MAX_PRODUCTS } from '@crossmart/core';

export class StoreProductsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    minItems: 1,
    maxItems: STORE_MEMBERSHIP_MAX_PRODUCTS,
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(STORE_MEMBERSHIP_MAX_PRODUCTS)
  @IsUUID('all', { each: true })
  productIds: string[];
}

export class StoreProductsResultDto {
  @ApiProperty({ description: 'Products added or removed' })
  count: number;

  static of(count: number): StoreProductsResultDto {
    return Object.assign(new StoreProductsResultDto(), { count });
  }
}
