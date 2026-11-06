import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CONFLICT_ERROR, ListingRetryErrorCode, RETRY_NEEDS_CONNECTION } from '@crossmart/core';
import { LISTING_RETRY_ERROR_CODE_SCHEMA_NAME } from '../listings.constants.js';

/** The body of a refused retry (409): NestJS's error shape plus a code clients can branch on. */
export class ListingRetryErrorDto {
  @ApiProperty({ example: HttpStatus.CONFLICT })
  statusCode: number;

  @ApiProperty({ example: CONFLICT_ERROR })
  error: string;

  @ApiProperty({
    enum: ListingRetryErrorCode,
    enumName: LISTING_RETRY_ERROR_CODE_SCHEMA_NAME,
    description:
      '`store_not_connected`: the store needs re-auth, was disconnected or is in error; ' +
      'reconnect it. `product_not_in_store`: the store does not select the product; add it.',
  })
  code: ListingRetryErrorCode;

  @ApiProperty({ example: RETRY_NEEDS_CONNECTION })
  message: string;
}
