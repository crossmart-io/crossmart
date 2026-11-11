import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@crossmart/connectors';
import type { ProductSale, SoldProductStore } from '@crossmart/core';
import { CHANNEL_TYPE_SCHEMA_NAME } from '../../channels/channels.constants.js';
import { ProductDto } from './product.dto.js';

export class SoldProductStoreDto implements SoldProductStore {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty()
  displayName: string;
}

/** What marking a product sold did. */
export class ProductSaleDto {
  @ApiProperty({
    type: ProductDto,
    description: 'The product as it is now, with every tracked variant at 0 available',
  })
  product: ProductDto;

  @ApiProperty({ description: 'Available units set to 0 across its tracked variants' })
  unitsCleared: number;

  @ApiProperty({
    type: [SoldProductStoreDto],
    description:
      'The stores it was taken off. Their listings are ended on the channel in the background, ' +
      'like removing a product from a store by hand.',
  })
  removedFromStores: SoldProductStoreDto[];

  @ApiProperty({
    description: 'True when it was sold already (no stock left, on no store): nothing changed',
  })
  alreadySold: boolean;

  static from(sale: ProductSale): ProductSaleDto {
    return Object.assign(new ProductSaleDto(), {
      product: ProductDto.from(sale.product),
      unitsCleared: sale.unitsCleared,
      removedFromStores: sale.removedFromStores.map((store) =>
        Object.assign(new SoldProductStoreDto(), store),
      ),
      alreadySold: sale.alreadySold,
    });
  }
}
