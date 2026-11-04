import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../sdk/http/http.constants.js';
import { isServerErrorStatus } from '../../sdk/http/http-status.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { EBAY_MESSAGE_MAX_LENGTH, EBAY_MESSAGE_NOISE } from '../ebay.constants.js';

const MESSAGE_SEPARATOR = ' ';

/**
 * The error body of eBay's REST APIs: `{ "errors": [{ "errorId": 25002, "message": "...",
 * "parameters": [{ "name": "2", "value": "Brand" }] }] }`.
 */
export const ebayErrorDetailSchema = z.object({
  errorId: z.number().int(),
  message: z.string().optional(),
  parameters: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export type EbayErrorDetail = z.infer<typeof ebayErrorDetailSchema>;

const ebayErrorBodySchema = z.object({ errors: z.array(ebayErrorDetailSchema) });

function errorsOf(response: HttpResponse): EbayErrorDetail[] {
  const parsed = ebayErrorBodySchema.safeParse(parseJsonBody(response.body));
  return parsed.success ? parsed.data.errors : [];
}

/** The `errorId`s of an eBay error response; empty when the body is not one. */
export function ebayErrorIds(response: HttpResponse): number[] {
  return errorsOf(response).map(({ errorId }) => errorId);
}

/**
 * What one error says, for a merchant. eBay's generic "A user error has occurred." prefix is
 * dropped; when nothing is left, the parameters carry the detail (such as a missing aspect).
 */
function describeError(error: EbayErrorDetail): string {
  const message = (error.message ?? '').replace(EBAY_MESSAGE_NOISE, '').trim();
  const detail =
    message || (error.parameters ?? []).map(({ value }) => value).join(MESSAGE_SEPARATOR);
  return detail.slice(0, EBAY_MESSAGE_MAX_LENGTH);
}

/**
 * eBay's own explanation of a rejected call, such as "The item specific Brand is missing.",
 * or null when the body holds none. Only the messages are kept, never the rest of the body.
 */
export function ebayRejectionMessage(response: HttpResponse): string | null {
  return describeEbayErrors(errorsOf(response));
}

/** What a list of eBay errors says, each message once; null when they say nothing. */
export function describeEbayErrors(errors: readonly EbayErrorDetail[]): string | null {
  const messages = new Set(errors.map(describeError).filter(Boolean));
  return messages.size > 0 ? [...messages].join(MESSAGE_SEPARATOR) : null;
}

/** What a failed status means to callers: re-auth, wait, retry later, or fix the request. */
export function ebayErrorCode(status: number): ChannelErrorCode {
  if (status === HTTP_STATUS_UNAUTHORIZED) return ChannelErrorCode.CredentialsRejected;
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) return ChannelErrorCode.RateLimited;
  if (isServerErrorStatus(status)) return ChannelErrorCode.ChannelUnavailable;
  return ChannelErrorCode.RequestRejected;
}
