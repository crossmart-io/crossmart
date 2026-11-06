import {
  SIGNATURE_ELEMENT_SEPARATOR,
  SIGNATURE_KEY_VALUE_SEPARATOR,
  SIGNATURE_SCHEME_V1,
  TIMESTAMP_KEY,
  UNIX_TIMESTAMP_PATTERN,
} from './webhooks.constants.js';
import { WebhookSignatureError, WebhookSignatureFailure } from './webhook-signature-error.js';

/** The parts of a `Crossmart-Signature` header that verification needs. */
export interface SignatureHeader {
  /** The raw `t` value, signed exactly as sent. */
  timestamp: string;
  /** Every `v1` signature: one, or two while the endpoint's secret is being rotated. */
  signatures: string[];
}

/**
 * Parses `t=<unix seconds>,v1=<hex>[,v1=<hex>...]`. Unknown schemes, such as `v0`, are ignored.
 */
export function parseSignatureHeader(header: string | null | undefined): SignatureHeader {
  if (header === null || header === undefined || header.trim() === '') {
    throw new WebhookSignatureError(WebhookSignatureFailure.MissingHeader);
  }
  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const element of header.split(SIGNATURE_ELEMENT_SEPARATOR)) {
    const [key, value] = splitElement(element);
    if (key === TIMESTAMP_KEY) {
      timestamp = value;
    } else if (key === SIGNATURE_SCHEME_V1) {
      signatures.push(value);
    }
  }
  return { timestamp: requireTimestamp(timestamp), signatures: requireSignatures(signatures) };
}

function splitElement(element: string): [string, string] {
  const separatorIndex = element.indexOf(SIGNATURE_KEY_VALUE_SEPARATOR);
  if (separatorIndex <= 0) {
    throw new WebhookSignatureError(WebhookSignatureFailure.MalformedHeader);
  }
  return [
    element.slice(0, separatorIndex).trim(),
    element.slice(separatorIndex + SIGNATURE_KEY_VALUE_SEPARATOR.length).trim(),
  ];
}

function requireTimestamp(timestamp: string | undefined): string {
  if (timestamp === undefined) {
    throw new WebhookSignatureError(WebhookSignatureFailure.MissingTimestamp);
  }
  if (!UNIX_TIMESTAMP_PATTERN.test(timestamp)) {
    throw new WebhookSignatureError(WebhookSignatureFailure.InvalidTimestamp);
  }
  return timestamp;
}

function requireSignatures(signatures: string[]): string[] {
  if (signatures.length === 0) {
    throw new WebhookSignatureError(WebhookSignatureFailure.MissingSignature);
  }
  return signatures;
}
