import { HttpException } from '@nestjs/common';

/** Long messages are cut here, so one error cannot flood the logs. */
export const MAX_LOGGED_ERROR_MESSAGE_LENGTH = 300;
const ELLIPSIS = '…';
const WHITESPACE_RUN = /\s+/g;

/**
 * An error that names its failure with a code, such as a channel error, a Prisma request error
 * or a Node system error. Their messages describe the failure, not the data sent.
 */
interface CodedError extends Error {
  code: string | number;
}

function isCodedError(error: Error): error is CodedError {
  const { code } = error as Partial<CodedError>;
  return typeof code === 'string' || typeof code === 'number';
}

/** The message on one line, cut to a bounded length. */
function oneLine(message: string): string {
  const flat = message.replace(WHITESPACE_RUN, ' ').trim();
  return flat.length > MAX_LOGGED_ERROR_MESSAGE_LENGTH
    ? flat.slice(0, MAX_LOGGED_ERROR_MESSAGE_LENGTH) + ELLIPSIS
    : flat;
}

/**
 * Describes an error for the logs without leaking what it may carry. Errors with a code and
 * HTTP exceptions (whose messages are written for users) keep their message; any other error
 * is named by its type only, since its message may hold tokens, bodies or personal data.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return typeof error;
  if (error instanceof HttpException) {
    return `${error.name} ${error.getStatus()}: ${oneLine(error.message)}`;
  }
  if (isCodedError(error)) {
    return `${error.name} ${String(error.code)}: ${oneLine(error.message)}`;
  }
  return error.name;
}
