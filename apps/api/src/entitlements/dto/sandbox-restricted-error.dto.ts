import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EntitlementErrorCode, FORBIDDEN_ERROR, SandboxRestriction } from '@crossmart/core';
import {
  ENTITLEMENT_ERROR_CODE_SCHEMA_NAME,
  SANDBOX_RESTRICTION_SCHEMA_NAME,
} from '../entitlements.constants.js';

/** The body of a 403 from an unclaimed sandbox account (ADR 0019). */
export class SandboxRestrictedErrorDto {
  @ApiProperty({ example: HttpStatus.FORBIDDEN })
  statusCode: number;

  @ApiProperty({ example: FORBIDDEN_ERROR })
  error: string;

  @ApiProperty({
    enum: EntitlementErrorCode,
    enumName: ENTITLEMENT_ERROR_CODE_SCHEMA_NAME,
    example: EntitlementErrorCode.SandboxClaimRequired,
  })
  code: EntitlementErrorCode;

  @ApiProperty({
    example:
      'This Crossmart account is an unclaimed sandbox, so it cannot connect a store. Ask the ' +
      'user to claim it with the link Crossmart emailed them (it works until 2026-11-21). Once ' +
      'claimed, you can connect a store.',
  })
  message: string;

  @ApiProperty({ enum: SandboxRestriction, enumName: SANDBOX_RESTRICTION_SCHEMA_NAME })
  restriction: SandboxRestriction;

  @ApiProperty({ description: 'When the claim link stops working and the sandbox is deleted' })
  claimExpiresAt: Date;
}
