import {
  BASIC_AUTH_SCHEME,
  BASIC_CREDENTIALS_ENCODING,
  BASIC_CREDENTIALS_SEPARATOR,
  BEARER_AUTH_SCHEME,
} from './http.constants.js';

/** The `Authorization` value for a bearer token. */
export function bearerAuthorization(accessToken: string): string {
  return `${BEARER_AUTH_SCHEME} ${accessToken}`;
}

/** The `Authorization` value for HTTP Basic authentication. */
export function basicAuthorization(userId: string, password: string): string {
  const pair = `${userId}${BASIC_CREDENTIALS_SEPARATOR}${password}`;
  return `${BASIC_AUTH_SCHEME} ${Buffer.from(pair).toString(BASIC_CREDENTIALS_ENCODING)}`;
}
