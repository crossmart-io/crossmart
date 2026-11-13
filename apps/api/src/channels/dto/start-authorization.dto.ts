import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ChannelType } from '@crossmart/connectors';
import type { AuthorizationRequest, StartedAuthorization } from '@crossmart/core';
import { ACCOUNT_HANDLE_MAX_LENGTH, CHANNEL_TYPE_SCHEMA_NAME } from '../channels.constants.js';

export class StartAuthorizationDto implements AuthorizationRequest {
  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty({
    maxLength: ACCOUNT_HANDLE_MAX_LENGTH,
    example: 'demo-store.myshopify.com',
    description:
      'The account to connect. For Shopify, the store’s myshopify.com domain or handle. For eBay, the marketplace id, such as `EBAY_US`. For Etsy, the shop name (the merchant must sign in to that shop). For Mercado Libre, the country site id, such as `MLM`.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_HANDLE_MAX_LENGTH)
  accountHandle: string;
}

export class StartedAuthorizationDto implements StartedAuthorization {
  @ApiProperty({ description: 'Send the merchant here to approve the app on the channel' })
  authorizationUrl: string;

  @ApiProperty({
    example: 'demo-store.myshopify.com',
    description:
      'The account handle, normalized: a myshopify.com domain, an eBay marketplace id, a lower-cased Etsy shop name or a Mercado Libre site id',
  })
  accountHandle: string;

  @ApiProperty({
    example: 'demo-store.myshopify.com',
    deprecated: true,
    description: 'The same value as `accountHandle`. Use `accountHandle` instead.',
  })
  externalAccountId: string;

  static from(started: StartedAuthorization): StartedAuthorizationDto {
    return Object.assign(new StartedAuthorizationDto(), started);
  }
}
