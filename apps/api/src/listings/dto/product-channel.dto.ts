import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@crossmart/connectors';
import type { ChannelVariantView, ConnectionSummary, ProductChannelView } from '@crossmart/core';
import { ChannelConnectionStatus } from '@crossmart/database';
import {
  CHANNEL_CONNECTION_STATUS_SCHEMA_NAME,
  CHANNEL_TYPE_SCHEMA_NAME,
} from '../../channels/channels.constants.js';
import { ListingSummaryDto } from './channel-listing.dto.js';
import { ListingOverrideViewDto } from './listing-override.dto.js';
import { ResolvedPriceDto } from './price-resolution.dto.js';

export class ConnectionSummaryDto implements ConnectionSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ enum: ChannelConnectionStatus, enumName: CHANNEL_CONNECTION_STATUS_SCHEMA_NAME })
  status: ChannelConnectionStatus;

  @ApiProperty({ example: 'USD' })
  currencyCode: string;
}

export class ChannelVariantDto implements ChannelVariantView {
  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty({ example: 'Blue / Large' })
  title: string;

  @ApiProperty({ type: ResolvedPriceDto })
  price: ResolvedPriceDto;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'The stock the channel shows; null when the variant does not track stock',
  })
  quantity: number | null;
}

/** A product on one connected channel: its listing, overrides, prices and shown stock. */
export class ProductChannelDto implements ProductChannelView {
  @ApiProperty({ type: ConnectionSummaryDto })
  connection: ConnectionSummaryDto;

  @ApiProperty({ description: 'Whether the connection’s product selection includes it' })
  selected: boolean;

  @ApiProperty({ type: ListingSummaryDto, nullable: true })
  listing: ListingSummaryDto | null;

  @ApiProperty({ type: ListingOverrideViewDto, nullable: true })
  override: ListingOverrideViewDto | null;

  @ApiProperty({ type: [ChannelVariantDto] })
  variants: ChannelVariantDto[];

  static from(view: ProductChannelView): ProductChannelDto {
    return Object.assign(new ProductChannelDto(), {
      connection: Object.assign(new ConnectionSummaryDto(), view.connection),
      selected: view.selected,
      listing: view.listing ? ListingSummaryDto.from(view.listing) : null,
      override: view.override ? ListingOverrideViewDto.from(view.override) : null,
      variants: view.variants.map((variant) =>
        Object.assign(new ChannelVariantDto(), {
          ...variant,
          price: ResolvedPriceDto.from(variant.price),
        }),
      ),
    });
  }
}
