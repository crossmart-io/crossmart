<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

/**
 * Why a webhook delivery was rejected.
 */
enum WebhookSignatureFailure: string
{
    case MissingHeader = 'missing_header';
    case MalformedHeader = 'malformed_header';
    case MissingTimestamp = 'missing_timestamp';
    case InvalidTimestamp = 'invalid_timestamp';
    case MissingSignature = 'missing_signature';
    case TimestampOutsideTolerance = 'timestamp_outside_tolerance';
    case SignatureMismatch = 'signature_mismatch';
    case InvalidPayload = 'invalid_payload';

    /** A message that never includes the signing secret. */
    public function message(): string
    {
        return match ($this) {
            self::MissingHeader => 'The Crossmart-Signature header is missing.',
            self::MalformedHeader => 'The Crossmart-Signature header is malformed.',
            self::MissingTimestamp => 'The Crossmart-Signature header has no timestamp (t=).',
            self::InvalidTimestamp => 'The Crossmart-Signature timestamp is not a Unix time in seconds.',
            self::MissingSignature => 'The Crossmart-Signature header has no v1 signature.',
            self::TimestampOutsideTolerance => 'The Crossmart-Signature timestamp is outside the tolerance.',
            self::SignatureMismatch => 'No signature matches the payload. Check the signing secret '
                . 'and that the body is the raw request body.',
            self::InvalidPayload => 'The webhook payload is not a JSON event object.',
        };
    }
}
