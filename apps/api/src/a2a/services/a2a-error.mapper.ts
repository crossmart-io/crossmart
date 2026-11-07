import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  AskConversationFullError,
  AskConversationNotFoundError,
  AskEscalationNotFoundError,
} from '@crossmart/core';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';
import { A2aErrorReason, A2aRpcError } from '../errors/a2a-rpc.error.js';

const INTERNAL_MESSAGE = 'Internal error';
const UNAVAILABLE_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.TOO_MANY_REQUESTS,
  HttpStatus.SERVICE_UNAVAILABLE,
]);
const logger = new Logger('A2aErrors');

function messageOf(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') return response;
  return error.message;
}

/**
 * The JSON-RPC error for a failure inside a method: A2A's own codes where they fit, a server
 * error for limits and outages (with the reason Ask gives), and a bare internal error for
 * anything unexpected, which is logged and never described to the caller.
 */
export function toRpcError(error: unknown, taskId?: string): A2aRpcError {
  if (error instanceof A2aRpcError) return error;
  if (error instanceof AskEscalationNotFoundError) return A2aRpcError.taskNotFound(taskId ?? '');
  const known = error instanceof HttpException ? fromHttpException(error) : null;
  if (known) return known;
  logger.error(`A2A call failed: ${error instanceof Error ? error.name : typeof error}`);
  return new A2aRpcError(A2aErrorCode.InternalError, INTERNAL_MESSAGE, A2aErrorReason.Internal);
}

/** A refusal of Ask's own, as the JSON-RPC error that says the same; null for anything else. */
function fromHttpException(error: HttpException): A2aRpcError | null {
  if (error instanceof AskConversationNotFoundError || error instanceof AskConversationFullError) {
    return A2aRpcError.invalidParams(messageOf(error));
  }
  if (UNAVAILABLE_STATUSES.has(error.getStatus())) {
    return new A2aRpcError(A2aErrorCode.ServerError, messageOf(error), A2aErrorReason.Unavailable);
  }
  if (error.getStatus() === HttpStatus.BAD_REQUEST) {
    return A2aRpcError.invalidParams(messageOf(error));
  }
  return null;
}
