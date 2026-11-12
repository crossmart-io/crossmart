import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsEnum, IsObject } from 'class-validator';
import { ChannelType } from '@crossmart/connectors';
import type { CompletedAuthorization, SellerCredentialsRequest } from '@crossmart/core';
import { CHANNEL_TYPE_SCHEMA_NAME } from '../channels.constants.js';
import { ChannelConnectionDto } from './channel-connection.dto.js';
import { FalabellaCredentialsDto } from './falabella-credentials.dto.js';

export class ConnectWithCredentialsDto implements SellerCredentialsRequest {
  @ApiProperty({
    enum: ChannelType,
    enumName: CHANNEL_TYPE_SCHEMA_NAME,
    description: 'A channel connected with credentials: `falabella`',
  })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty({
    oneOf: [{ $ref: getSchemaPath(FalabellaCredentialsDto) }],
    description: 'The credentials the channel issued, with the fields of its schema',
  })
  @IsObject()
  credentials: Record<string, unknown>;
}

/** A connection made with credentials, and whether the account was connected before. */
export class ConnectedChannelDto {
  @ApiProperty({ type: ChannelConnectionDto })
  connection: ChannelConnectionDto;

  @ApiProperty({ description: 'True when the account was connected before and got new keys' })
  reconnected: boolean;

  static from(completed: CompletedAuthorization): ConnectedChannelDto {
    return Object.assign(new ConnectedChannelDto(), {
      connection: ChannelConnectionDto.from(completed.connection),
      reconnected: completed.reconnected,
    });
  }
}
