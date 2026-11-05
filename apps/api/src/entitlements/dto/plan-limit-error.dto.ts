import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EntitlementErrorCode, Feature, PAYMENT_REQUIRED_ERROR } from '@crossmart/core';
import {
  ENTITLEMENT_ERROR_CODE_SCHEMA_NAME,
  FEATURE_SCHEMA_NAME,
} from '../entitlements.constants.js';

/** The body of a 402: NestJS's error shape plus what a client needs to offer an upgrade. */
export class PlanLimitErrorDto {
  @ApiProperty({ example: HttpStatus.PAYMENT_REQUIRED })
  statusCode: number;

  @ApiProperty({ example: PAYMENT_REQUIRED_ERROR })
  error: string;

  @ApiProperty({ enum: EntitlementErrorCode, enumName: ENTITLEMENT_ERROR_CODE_SCHEMA_NAME })
  code: EntitlementErrorCode;

  @ApiProperty({
    example:
      'The Free plan includes 2 connected channels, and 2 are in use. Upgrade the plan to add more.',
  })
  message: string;

  @ApiProperty({ enum: Feature, enumName: FEATURE_SCHEMA_NAME })
  feature: Feature;

  @ApiProperty({ example: 'free', description: 'The code of the organization’s plan' })
  plan: string;

  @ApiProperty({ type: Number, nullable: true, description: 'Null is unlimited' })
  limit: number | null;

  @ApiProperty()
  usage: number;

  @ApiProperty({ description: 'How many more the request asked for' })
  requested: number;
}
