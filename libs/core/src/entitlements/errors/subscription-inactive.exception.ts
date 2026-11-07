import { HttpException, HttpStatus } from '@nestjs/common';
import { PAYMENT_REQUIRED_ERROR } from '../entitlements.constants.js';
import type { SubscriptionAccess } from '../entities/subscription-access.js';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import type { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';
import { subscriptionInactiveMessage } from '../rules/subscription-inactive-message.js';

/** The body of a read-only refusal: NestJS's error shape plus why the organization is read-only. */
export interface SubscriptionInactiveErrorBody {
  statusCode: HttpStatus.PAYMENT_REQUIRED;
  error: string;
  code: EntitlementErrorCode.SubscriptionInactive;
  message: string;
  state: SubscriptionAccessState;
}

/**
 * The organization has no subscription in good standing, so it is read-only (ADR 0024). HTTP 402
 * with `code: subscription_inactive`, like a plan limit: the caller may do it, and paying fixes
 * it. A billing admin of the organization does that, not the caller's own permissions.
 */
export class SubscriptionInactiveException extends HttpException {
  constructor(readonly access: SubscriptionAccess) {
    super(SubscriptionInactiveException.body(access), HttpStatus.PAYMENT_REQUIRED);
    this.name = 'SubscriptionInactiveException';
  }

  private static body({ state }: SubscriptionAccess): SubscriptionInactiveErrorBody {
    return {
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      error: PAYMENT_REQUIRED_ERROR,
      code: EntitlementErrorCode.SubscriptionInactive,
      message: subscriptionInactiveMessage(state),
      state,
    };
  }
}
