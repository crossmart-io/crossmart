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
  MERCADOLIBRE_CAUSE_SEPARATOR,
  MERCADOLIBRE_MESSAGE_MAX_LENGTH,
} from '../mercadolibre.constants.js';

/** Mercado Libre's error body (Design considerations): `message`, `error`, `status`, `cause`. */
const errorBodySchema = z.object({
  message: z.string().optional(),
  cause: z
    .array(z.object({ message: z.string().optional() }).loose())
    .optional()
    .catch([]),
});

/**
 * Mercado Libre's explanation of a failed call, cut short: the messages of its causes (such as
 * a missing required attribute), else its `message`; null when the body holds neither.
 */
export function mercadoLibreErrorMessage(response: HttpResponse): string | null {
  const parsed = errorBodySchema.safeParse(parseJsonBody(response.body));
  if (!parsed.success) return null;
  const causes = (parsed.data.cause ?? []).flatMap((cause) =>
    cause.message?.trim() ? [cause.message.trim()] : [],
  );
  const message = causes.length > 0 ? causes.join(MERCADOLIBRE_CAUSE_SEPARATOR) : '';
  const text = message || parsed.data.message?.trim() || '';
  return text ? text.slice(0, MERCADOLIBRE_MESSAGE_MAX_LENGTH) : null;
}

/** What a failed status means to callers: re-auth, wait, retry later, or fix the request. */
export function mercadoLibreErrorCode(status: number): ChannelErrorCode {
  if (status === HTTP_STATUS_UNAUTHORIZED) return ChannelErrorCode.CredentialsRejected;
  if (status === HTTP_STATUS_TOO_MANY_REQUESTS) return ChannelErrorCode.RateLimited;
  if (isServerErrorStatus(status)) return ChannelErrorCode.ChannelUnavailable;
  return ChannelErrorCode.RequestRejected;
}
