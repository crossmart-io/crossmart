import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ConnectFailure } from '@crossmart/core';
import { CONNECT_FAILURE_SCHEMA_NAME } from '../channels.constants.js';

/** The body of a 422: the channel refused the pasted credentials. */
export class CredentialsRejectedErrorDto {
  @ApiProperty({ example: HttpStatus.UNPROCESSABLE_ENTITY })
  statusCode: number;

  @ApiProperty({ example: 'Unprocessable Entity' })
  error: string;

  @ApiProperty({ enum: ConnectFailure, enumName: CONNECT_FAILURE_SCHEMA_NAME })
  failure: ConnectFailure;

  @ApiProperty({
    example:
      'Falabella rejected the user id or API key. Copy them again from Seller Center.: E007: Login failed. Signature mismatching',
  })
  message: string;
}
