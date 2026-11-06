import { CrossmartError } from '../errors.js';

/** Why a webhook delivery was rejected. */
export enum WebhookSignatureFailure {
  MissingHeader = 'missing_header',
  MalformedHeader = 'malformed_header',
  MissingTimestamp = 'missing_timestamp',
  InvalidTimestamp = 'invalid_timestamp',
  MissingSignature = 'missing_signature',
  TimestampOutsideTolerance = 'timestamp_outside_tolerance',
  SignatureMismatch = 'signature_mismatch',
  InvalidPayload = 'invalid_payload',
}

const FAILURE_MESSAGES: Readonly<Record<WebhookSignatureFailure, string>> = {
  [WebhookSignatureFailure.MissingHeader]: 'The Crossmart-Signature header is missing.',
  [WebhookSignatureFailure.MalformedHeader]: 'The Crossmart-Signature header is malformed.',
  [WebhookSignatureFailure.MissingTimestamp]:
    'The Crossmart-Signature header has no timestamp (t=).',
  [WebhookSignatureFailure.InvalidTimestamp]:
    'The Crossmart-Signature timestamp is not a Unix time in seconds.',
  [WebhookSignatureFailure.MissingSignature]: 'The Crossmart-Signature header has no v1 signature.',
  [WebhookSignatureFailure.TimestampOutsideTolerance]:
    'The Crossmart-Signature timestamp is outside the tolerance.',
  [WebhookSignatureFailure.SignatureMismatch]:
    'No signature matches the payload. Check the signing secret and that the body is the raw request body.',
  [WebhookSignatureFailure.InvalidPayload]: 'The webhook payload is not a JSON event object.',
};

/**
 * A webhook delivery failed verification. Answer it with a 400 and do not process it.
 * `reason` tells why; the message never includes the signing secret.
 */
export class WebhookSignatureError extends CrossmartError {
  readonly reason: WebhookSignatureFailure;

  constructor(reason: WebhookSignatureFailure, options?: ErrorOptions) {
    super(FAILURE_MESSAGES[reason], options);
    this.name = 'WebhookSignatureError';
    this.reason = reason;
  }
}
