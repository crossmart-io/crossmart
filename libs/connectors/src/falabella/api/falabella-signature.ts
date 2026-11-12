import { createHmac } from 'node:crypto';
import {
  FALABELLA_SIGNATURE_ALGORITHM,
  FALABELLA_SIGNATURE_ENCODING,
  ISO_SECONDS_LENGTH,
  PERCENT_ENCODING_RADIX,
  QUERY_PAIR_SEPARATOR,
  QUERY_VALUE_SEPARATOR,
  RFC3986_EXTRA_RESERVED,
  UTC_OFFSET_SUFFIX,
} from '../falabella.constants.js';

/** Percent-encodes per RFC 3986, as PHP's `rawurlencode` in Falabella's reference code does. */
export function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    RFC3986_EXTRA_RESERVED,
    (character) => `%${character.charCodeAt(0).toString(PERCENT_ENCODING_RADIX).toUpperCase()}`,
  );
}

/** The parameters sorted by name, encoded and joined: both the string to sign and the query. */
export function canonicalQuery(params: Readonly<Record<string, string>>): string {
  return Object.keys(params)
    .sort()
    .map((name) => `${encodeRfc3986(name)}${QUERY_VALUE_SEPARATOR}${encodeRfc3986(params[name])}`)
    .join(QUERY_PAIR_SEPARATOR);
}

/**
 * The `Signature` of a request: the HMAC-SHA256 of its canonical query under the user's API
 * key, in lowercase hex. The key never leaves Crossmart; only the signature is sent.
 */
export function signFalabellaQuery(
  params: Readonly<Record<string, string>>,
  apiKey: string,
): string {
  return createHmac(FALABELLA_SIGNATURE_ALGORITHM, apiKey)
    .update(canonicalQuery(params))
    .digest(FALABELLA_SIGNATURE_ENCODING);
}

/** `2015-07-01T11:11:11+00:00`: ISO 8601 in UTC to the second, as the signing docs show. */
export function falabellaTimestamp(now: Date): string {
  return `${now.toISOString().slice(0, ISO_SECONDS_LENGTH)}${UTC_OFFSET_SUFFIX}`;
}
