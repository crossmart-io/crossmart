import { encodeParams } from './form-encoding.js';
import {
  ACCEPT_HEADER,
  CONTENT_TYPE_HEADER,
  FORM_CONTENT_TYPE,
  JSON_CONTENT_TYPE,
} from './http.constants.js';
import { HttpMethod } from './http-method.enum.js';
import type { HttpRequest } from './http-transport.js';

/** A form-encoded POST that expects JSON back, as OAuth token and revocation endpoints take. */
export function formPostRequest(
  url: string,
  params: Readonly<Record<string, string>>,
  headers: Readonly<Record<string, string>> = {},
): HttpRequest {
  return {
    method: HttpMethod.Post,
    url,
    headers: {
      ...headers,
      [CONTENT_TYPE_HEADER]: FORM_CONTENT_TYPE,
      [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
    },
    body: encodeParams(params),
  };
}
