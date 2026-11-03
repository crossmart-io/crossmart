import { ApiProperty } from '@nestjs/swagger';
import { ChannelFeature, ChannelType, isShopifySettings } from '@crossmart/connectors';
import type { ChannelConnectionView } from '@crossmart/core';
import { ChannelConnectionStatus } from '@crossmart/database';
import {
  CHANNEL_CONNECTION_STATUS_SCHEMA_NAME,
  CHANNEL_FEATURE_SCHEMA_NAME,
  CHANNEL_TYPE_SCHEMA_NAME,
} from '../channels.constants.js';
import { PricingRuleDto } from '../../listings/dto/pricing-rule.dto.js';
import { ProductSelectionRuleDto, ShopifySettingsDto } from './channel-settings.dto.js';

/** A channel connection. Credentials are never part of it. */
export class ChannelConnectionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty({ example: 'demo-store.myshopify.com', description: 'The account on the channel' })
  externalAccountId: string;

  @ApiProperty({ example: 'Demo Store' })
  displayName: string;

  @ApiProperty({ enum: ChannelConnectionStatus, enumName: CHANNEL_CONNECTION_STATUS_SCHEMA_NAME })
  status: ChannelConnectionStatus;

  @ApiProperty({ type: String, nullable: true, description: 'Why it needs re-auth or failed' })
  statusReason: string | null;

  @ApiProperty({ type: [String] })
  grantedScopes: string[];

  @ApiProperty({
    enum: ChannelFeature,
    enumName: CHANNEL_FEATURE_SCHEMA_NAME,
    isArray: true,
    description: 'What the connection cannot do until the merchant approves the app again',
  })
  missingFeatures: ChannelFeature[];

  @ApiProperty({
    type: ShopifySettingsDto,
    nullable: true,
    description: 'The store’s details, for Shopify connections',
  })
  shopify: ShopifySettingsDto | null;

  @ApiProperty({
    type: ProductSelectionRuleDto,
    nullable: true,
    description: 'Which products the connection lists; null lists every product',
  })
  productSelection: ProductSelectionRuleDto | null;

  @ApiProperty({
    type: PricingRuleDto,
    nullable: true,
    description: 'How the connection prices variants; null sends catalog prices',
  })
  pricing: PricingRuleDto | null;

  @ApiProperty()
  connectedAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  disconnectedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  lastSyncedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Listings in this store whose last sync failed' })
  failedListings: number;

  static from(view: ChannelConnectionView, failedListings = 0): ChannelConnectionDto {
    const { settings, ...fields } = view;
    const { account, productSelection, pricing } = settings;
    return Object.assign(new ChannelConnectionDto(), {
      ...fields,
      failedListings,
      shopify: account && isShopifySettings(account) ? ShopifySettingsDto.from(account) : null,
      productSelection: productSelection ? ProductSelectionRuleDto.from(productSelection) : null,
      pricing: pricing ? PricingRuleDto.from(pricing) : null,
    });
  }
}
