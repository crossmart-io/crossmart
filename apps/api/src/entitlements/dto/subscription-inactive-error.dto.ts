import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  EntitlementErrorCode,
  PAYMENT_REQUIRED_ERROR,
  SubscriptionAccessState,
} from '@crossmart/core';
import {
  ENTITLEMENT_ERROR_CODE_SCHEMA_NAME,
  SUBSCRIPTION_ACCESS_STATE_SCHEMA_NAME,
} from '../entitlements.constants.js';

/** The body of a 402 from a read-only organization (ADR 0024). */
export class SubscriptionInactiveErrorDto {
  @ApiProperty({ example: HttpStatus.PAYMENT_REQUIRED })
  statusCode: number;

  @ApiProperty({ example: PAYMENT_REQUIRED_ERROR })
  error: string;

  @ApiProperty({
    enum: EntitlementErrorCode,
    enumName: ENTITLEMENT_ERROR_CODE_SCHEMA_NAME,
    example: EntitlementErrorCode.SubscriptionInactive,
  })
  code: EntitlementErrorCode;

  @ApiProperty({
    example:
      "This organization's Crossmart subscription is canceled, so the account is read-only: " +
      'data can be read, but not changed, published or synced. Ask an owner or admin of the ' +
      'organization to choose a plan in Settings > Billing.',
  })
  message: string;

  @ApiProperty({ enum: SubscriptionAccessState, enumName: SUBSCRIPTION_ACCESS_STATE_SCHEMA_NAME })
  state: SubscriptionAccessState;
}
