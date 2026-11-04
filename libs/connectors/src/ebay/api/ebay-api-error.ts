import { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../sdk/http/http.constants.js';
import { isServerErrorStatus } from '../../sdk/http/http-status.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';

/** The error body of eBay's REST APIs: `{ "errors": [{ "errorId": 20403, ... }] }`. */
const ebayErrorBodySchema = z.object({
  errors: z.array(z.object({ errorId: z.number().int() })),
});

/** The `errorId`s of an eBay error response; empty when the body is not one. */
export function ebayErrorIds(response: HttpResponse): number[] {
  const parsed = ebayErrorBodySchema.safeParse(parseJsonBody(response.body));
  return parsed.success ? parsed.data.errors.map(({ errorId }) => errorId) : [];
}

/** What a failed status means to callers: re-auth, wait, retry later, or fix the request. */
export function ebayErrorCode(status: number): ChannelErrorCode {
  if (status === HTTP_STATUS_UNAUTHORIZED) return ChannelErrorCode.CredentialsRejected;
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) return ChannelErrorCode.RateLimited;
  if (isServerErrorStatus(status)) return ChannelErrorCode.ChannelUnavailable;
  return ChannelErrorCode.RequestRejected;
}
