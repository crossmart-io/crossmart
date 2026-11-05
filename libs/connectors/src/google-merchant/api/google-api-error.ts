import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../sdk/http/http.constants.js';
import { isServerErrorStatus } from '../../sdk/http/http-status.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import {
  GoogleErrorReason,
  NOT_REGISTERED_MESSAGE_FRAGMENT,
} from '../google-merchant.constants.js';

/** Longest part of Google's message kept in an error a merchant reads. */
const MESSAGE_MAX_LENGTH = 500;

/**
 * Google's error body (`google.rpc.Status`): `{ "error": { "code": 400, "status":
 * "INVALID_ARGUMENT", "message": "...", "details": [{ "metadata": { "REASON": "..." } }] } }`.
 */
const googleErrorBodySchema = z.object({
  error: z.object({
    code: z.number().int().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    details: z
      .array(z.object({ metadata: z.record(z.string(), z.string()).optional() }).loose())
      .optional(),
  }),
});

export interface GoogleApiError {
  message: string | null;
  reasons: string[];
}

/** What a Google error response says; empty when the body is not one. */
export function googleApiError(response: HttpResponse): GoogleApiError {
  const parsed = googleErrorBodySchema.safeParse(parseJsonBody(response.body));
  if (!parsed.success) return { message: null, reasons: [] };
  const { message, details } = parsed.data.error;
  const reasons = (details ?? []).flatMap((detail) =>
    detail.metadata?.REASON ? [detail.metadata.REASON] : [],
  );
  return { message: message ? message.slice(0, MESSAGE_MAX_LENGTH) : null, reasons };
}

/** The project is not registered with the Merchant API: only Crossmart's operator can fix it. */
export function isUnregisteredProject(error: GoogleApiError): boolean {
  return (
    error.reasons.includes(GoogleErrorReason.GcpNotRegistered) ||
    (error.message?.includes(NOT_REGISTERED_MESSAGE_FRAGMENT) ?? false)
  );
}

/** The signed-in Google user cannot manage the Merchant Center account. */
export function isAccountDenied(error: GoogleApiError): boolean {
  return error.reasons.includes(GoogleErrorReason.PermissionDeniedAccounts);
}

/** What a failed status means to callers: re-auth, wait, retry later, or fix the request. */
export function googleErrorCode(status: number, error: GoogleApiError): ChannelErrorCode {
  if (isUnregisteredProject(error)) return ChannelErrorCode.ChannelUnavailable;
  if (isAccountDenied(error)) return ChannelErrorCode.InvalidAccount;
  if (status === HTTP_STATUS_UNAUTHORIZED) return ChannelErrorCode.CredentialsRejected;
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) return ChannelErrorCode.RateLimited;
  if (isServerErrorStatus(status)) return ChannelErrorCode.ChannelUnavailable;
  return ChannelErrorCode.RequestRejected;
}
