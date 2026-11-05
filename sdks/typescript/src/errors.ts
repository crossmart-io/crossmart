import { UNKNOWN_ERROR_MESSAGE, VALIDATION_MESSAGE_SEPARATOR } from './crossmart.constants.js';

/** Base class of every error the SDK throws, so `instanceof CrossmartError` catches them all. */
export class CrossmartError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'CrossmartError';
  }
}

/**
 * The API answered with an error status (4xx or 5xx).
 *
 * `message` is the API's own message. Validation errors (400) list every problem in `details`
 * and join them in `message`. `code` is the API's machine-readable reason when it sends one,
 * such as `plan_limit_reached` on a 402 (compare with the exported `EntitlementErrorCode` enum).
 *
 * @example
 * ```ts
 * import { CrossmartApiError, EntitlementErrorCode } from '@crossmart/sdk';
 *
 * try {
 *   await crossmart.listings.publish(productId, connectionId);
 * } catch (error) {
 *   if (error instanceof CrossmartApiError && error.code === EntitlementErrorCode.plan_limit_reached) {
 *     console.log('Upgrade the plan to list more products:', error.message);
 *   } else {
 *     throw error;
 *   }
 * }
 * ```
 */
export class CrossmartApiError extends CrossmartError {
  /** The HTTP status, such as 404. */
  readonly status: number;
  /** The API's machine-readable error code, when the response has one. */
  readonly code: string | undefined;
  /** Every message the API returned; several for a validation error. */
  readonly details: readonly string[];
  /** The parsed response body, for fields this class does not surface (such as a plan's `limit`). */
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    const details = readMessages(body);
    super(details.length > 0 ? details.join(VALIDATION_MESSAGE_SEPARATOR) : UNKNOWN_ERROR_MESSAGE);
    this.name = 'CrossmartApiError';
    this.status = status;
    this.code = readStringField(body, 'code');
    this.details = details;
    this.body = body;
  }
}

/** NestJS sends `message` as a string, or as a list of validation messages. */
function readMessages(body: unknown): string[] {
  if (typeof body === 'string') {
    return body.length > 0 ? [body] : [];
  }
  if (!isRecord(body)) {
    return [];
  }
  const { message } = body;
  if (typeof message === 'string') {
    return [message];
  }
  return Array.isArray(message)
    ? message.filter((line): line is string => typeof line === 'string')
    : [];
}

function readStringField(body: unknown, field: string): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  const value = body[field];
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
