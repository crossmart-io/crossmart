import { HttpException, HttpStatus } from '@nestjs/common';
import { PAYMENT_REQUIRED_ERROR } from '../entitlements.constants.js';
import type { EntitlementCheck } from '../entities/entitlement-check.js';
import type { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import type { Feature } from '../enums/feature.enum.js';
import { entitlementErrorCode, entitlementMessage } from '../rules/entitlement-message.js';

/** The body of a 402 response: NestJS's error shape plus what clients need to offer an upgrade. */
export interface EntitlementErrorBody {
  statusCode: HttpStatus.PAYMENT_REQUIRED;
  error: string;
  code: EntitlementErrorCode;
  message: string;
  feature: Feature;
  /** The plan's code, such as "free". */
  plan: string;
  limit: number | null;
  usage: number;
  requested: number;
}

/**
 * The organization's plan does not allow the action. HTTP 402 Payment Required: the caller may
 * do it, the plan may not, and upgrading resolves it. A 403 stays reserved for permissions, so
 * clients can tell "ask an admin" from "upgrade".
 */
export class EntitlementExceededException extends HttpException {
  constructor(readonly check: EntitlementCheck) {
    super(EntitlementExceededException.body(check), HttpStatus.PAYMENT_REQUIRED);
    this.name = 'EntitlementExceededException';
  }

  private static body(check: EntitlementCheck): EntitlementErrorBody {
    const { feature, limit, usage, requested } = check;
    return {
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      error: PAYMENT_REQUIRED_ERROR,
      code: entitlementErrorCode(check),
      message: entitlementMessage(check),
      feature,
      plan: check.plan.code,
      limit,
      usage,
      requested,
    };
  }
}
