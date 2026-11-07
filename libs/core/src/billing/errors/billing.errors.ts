import { BadRequestException } from '@nestjs/common';
import { INVALID_WEBHOOK_SIGNATURE } from '../billing.constants.js';

/** A webhook delivery the provider did not sign, or signed with another secret. HTTP 400. */
export class InvalidWebhookSignatureError extends BadRequestException {
  constructor() {
    super(INVALID_WEBHOOK_SIGNATURE);
    this.name = 'InvalidWebhookSignatureError';
  }
}

/** The provider holds a subscription in a state this version of Crossmart does not know. */
export class UnknownSubscriptionStatusError extends Error {
  constructor(status: string) {
    super(`Unknown billing subscription status: ${status}`);
    this.name = 'UnknownSubscriptionStatusError';
  }
}
