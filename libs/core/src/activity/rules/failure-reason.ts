import { HttpException } from '@nestjs/common';
import { UNEXPECTED_FAILURE_REASON } from '../activity.constants.js';

/**
 * A reason that is safe to store and show. Only HTTP exceptions carry messages written for
 * users; anything else may contain internals (queries, values), so it is not stored.
 */
export function toFailureReason(error: unknown): string {
  return error instanceof HttpException ? error.message : UNEXPECTED_FAILURE_REASON;
}
