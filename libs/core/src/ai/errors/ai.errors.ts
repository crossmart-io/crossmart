import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { AI_NOT_CONFIGURED_MESSAGE, AI_OUTPUT_REJECTED_MESSAGE } from '../ai.constants.js';

/** No AI provider key is set. Clients show the "not configured" state. */
export class AiNotConfiguredError extends ServiceUnavailableException {
  constructor() {
    super(AI_NOT_CONFIGURED_MESSAGE);
  }
}

/**
 * The model's answer was refused, cut off, not JSON, or did not match its schema. Nothing
 * from it is stored. The reason names what failed, never the content.
 */
export class AiOutputRejectedError extends BadGatewayException {
  constructor(readonly reason: string) {
    super(AI_OUTPUT_REJECTED_MESSAGE);
  }
}
