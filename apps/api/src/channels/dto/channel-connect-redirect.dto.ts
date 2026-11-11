import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@crossmart/connectors';
import { ConnectFailure } from '@crossmart/core';
import { CHANNEL_TYPE_SCHEMA_NAME, CONNECT_FAILURE_SCHEMA_NAME } from '../channels.constants.js';

/**
 * The query parameters the OAuth callback adds when it sends the merchant back to the web
 * app's Stores page (`/stores`). Published so the web client reads them with generated types.
 */
export class ChannelConnectRedirectDto {
  @ApiPropertyOptional({
    enum: ChannelType,
    enumName: CHANNEL_TYPE_SCHEMA_NAME,
    description: 'Set when the account was connected',
  })
  connected?: ChannelType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Set with `connected`: the id of the connection that was connected',
  })
  connectionId?: string;

  @ApiPropertyOptional({
    description:
      'Set with `connected` to `true` when the account was connected before (a re-auth), ' +
      'so the web app does not offer the new store setup',
  })
  reconnected?: boolean;

  @ApiPropertyOptional({
    enum: ConnectFailure,
    enumName: CONNECT_FAILURE_SCHEMA_NAME,
    description: 'Set when connecting failed',
  })
  error?: ConnectFailure;

  @ApiPropertyOptional({
    enum: ChannelType,
    enumName: CHANNEL_TYPE_SCHEMA_NAME,
    description: 'The channel an error is about',
  })
  channel?: ChannelType;
}
