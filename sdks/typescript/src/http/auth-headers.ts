import {
  API_KEY_HEADER,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  MISSING_CREDENTIALS_MESSAGE,
} from '../crossmart.constants.js';
import { CrossmartError } from '../errors.js';
import type { CrossmartCredentials } from '../options.js';

/** The header that authenticates every request: `x-api-key` for a key, a bearer token otherwise. */
export function authHeaders(credentials: CrossmartCredentials): Record<string, string> {
  if (isNonEmpty(credentials.apiKey)) {
    return { [API_KEY_HEADER]: credentials.apiKey };
  }
  if (isNonEmpty(credentials.accessToken)) {
    return { [AUTHORIZATION_HEADER]: `${BEARER_PREFIX}${credentials.accessToken}` };
  }
  throw new CrossmartError(MISSING_CREDENTIALS_MESSAGE);
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}
