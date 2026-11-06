import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../sdk/http/http.constants.js';
import { isServerErrorStatus } from '../../sdk/http/http-status.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { ETSY_MESSAGE_MAX_LENGTH } from '../etsy.constants.js';

/** Etsy's error body (`ErrorSchema` in its spec): `{ "error": "..." }`. */
const etsyErrorBodySchema = z.object({ error: z.string() });

/** Etsy's own explanation of a failed call, cut short; null when the body holds none. */
export function etsyErrorMessage(response: HttpResponse): string | null {
  const parsed = etsyErrorBodySchema.safeParse(parseJsonBody(response.body));
  const message = parsed.success ? parsed.data.error.trim() : '';
  return message ? message.slice(0, ETSY_MESSAGE_MAX_LENGTH) : null;
}

/** What a failed status means to callers: re-auth, wait, retry later, or fix the request. */
export function etsyErrorCode(status: number): ChannelErrorCode {
  if (status === HTTP_STATUS_UNAUTHORIZED) return ChannelErrorCode.CredentialsRejected;
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) return ChannelErrorCode.RateLimited;
  if (isServerErrorStatus(status)) return ChannelErrorCode.ChannelUnavailable;
  return ChannelErrorCode.RequestRejected;
}
