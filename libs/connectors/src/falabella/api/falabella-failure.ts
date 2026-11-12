import type { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HTTP_STATUS_TOO_MANY_REQUESTS } from '../../sdk/http/http.constants.js';
import {
  ERROR_DETAIL_SEPARATOR,
  FALABELLA_ACCESS_DENIED_CODE,
  FALABELLA_ERROR_DETAILS_SHOWN,
  FALABELLA_LOGIN_FAILED_CODE,
  FALABELLA_TOO_MANY_REQUESTS_CODE,
} from '../falabella.constants.js';
import { FalabellaErrorType } from '../falabella.enums.js';
import { FALABELLA_ERROR_MESSAGES, falabellaError } from '../falabella-errors.js';
import type { FalabellaErrorDetail, FalabellaErrorResponse } from './falabella-responses.js';

const DETAIL_SEPARATOR = ': ';
const FIELD_SEPARATOR = ': ';

const CODE_FAILURES: ReadonlyMap<number, ChannelErrorCode> = new Map([
  [FALABELLA_LOGIN_FAILED_CODE, ChannelErrorCode.CredentialsRejected],
  [FALABELLA_ACCESS_DENIED_CODE, ChannelErrorCode.AccessDenied],
  [FALABELLA_TOO_MANY_REQUESTS_CODE, ChannelErrorCode.RateLimited],
]);

/** The numeric error code: `ErrorCode`, which the docs pair with `E0xx` in the message. */
export function falabellaErrorCode(response: FalabellaErrorResponse): number | null {
  const code = Number(response.Head.ErrorCode);
  return Number.isInteger(code) ? code : null;
}

function failureCode(response: FalabellaErrorResponse): ChannelErrorCode {
  const known = CODE_FAILURES.get(falabellaErrorCode(response) ?? Number.NaN);
  if (known) return known;
  return response.Head.ErrorType === FalabellaErrorType.Platform
    ? ChannelErrorCode.ChannelUnavailable
    : ChannelErrorCode.RequestRejected;
}

function describeDetail({ Field, Message }: FalabellaErrorDetail): string | null {
  if (!Message) return null;
  return Field ? `${Field}${FIELD_SEPARATOR}${Message}` : Message;
}

/** Falabella's message, then its first few details. It never holds credentials. */
function explanation(response: FalabellaErrorResponse): string | null {
  const details = (response.Body?.ErrorDetail ?? [])
    .slice(0, FALABELLA_ERROR_DETAILS_SHOWN)
    .flatMap((detail) => describeDetail(detail) ?? []);
  const parts = [response.Head.ErrorMessage, ...details].filter((part) => !!part);
  return parts.length > 0 ? parts.join(ERROR_DETAIL_SEPARATOR) : null;
}

/** The `ChannelError` an `ErrorResponse` means. */
export function falabellaFailure(response: FalabellaErrorResponse): ChannelError {
  const code = failureCode(response);
  const detail = explanation(response);
  const message = FALABELLA_ERROR_MESSAGES[code];
  return falabellaError(code, detail ? `${message}${DETAIL_SEPARATOR}${detail}` : message);
}

/** A failed response Crossmart cannot read: throttled, or an outage. */
export function unreadableFailure(status: number): ChannelError {
  const code =
    status === HTTP_STATUS_TOO_MANY_REQUESTS
      ? ChannelErrorCode.RateLimited
      : ChannelErrorCode.ChannelUnavailable;
  return falabellaError(code, FALABELLA_ERROR_MESSAGES[code]);
}

/** Falabella could not be reached, or answered with something Crossmart does not understand. */
export function unavailableFailure(): ChannelError {
  return falabellaError(
    ChannelErrorCode.ChannelUnavailable,
    FALABELLA_ERROR_MESSAGES[ChannelErrorCode.ChannelUnavailable],
  );
}
