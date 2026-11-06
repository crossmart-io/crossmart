<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

use Crossmart\Exception\WebhookSignatureException;
use JsonException;

/**
 * Verifies that a webhook delivery comes from Crossmart.
 *
 * ```php
 * $event = WebhookSignature::verify(
 *     (string) file_get_contents('php://input'),
 *     $_SERVER[WebhookHeader::Signature->serverKey()] ?? null,
 *     $signingSecret,
 * );
 * ```
 */
final class WebhookSignature
{
    /** How far the signature's timestamp may be from the current time, either way. */
    public const DEFAULT_TOLERANCE_SECONDS = 300;

    private const HMAC_ALGORITHM = 'sha256';
    private const SIGNED_PAYLOAD_SEPARATOR = '.';
    private const JSON_MAX_DEPTH = 512;

    private function __construct()
    {
    }

    /**
     * Checks the `Crossmart-Signature` header against the raw body and returns the parsed event.
     *
     * @param string $payload The raw request body, exactly as received. A re-encoded body does not match.
     * @param string|null $header The value of the `Crossmart-Signature` header.
     * @param string $secret The endpoint's signing secret, including its `whsec_` prefix.
     * @param int $toleranceSeconds How far the signature's timestamp may be from `$now`.
     * @param int|null $now The current Unix time. Defaults to the system clock; pass one in tests.
     *
     * @throws WebhookSignatureException when the header is missing or malformed, the timestamp is
     *     outside the tolerance, no signature matches, or the body is not a JSON event.
     */
    public static function verify(
        string $payload,
        ?string $header,
        string $secret,
        int $toleranceSeconds = self::DEFAULT_TOLERANCE_SECONDS,
        ?int $now = null,
    ): WebhookEvent {
        $signatureHeader = SignatureHeader::parse($header);
        self::assertWithinTolerance((int) $signatureHeader->timestamp, $now ?? time(), $toleranceSeconds);
        $expected = hash_hmac(
            self::HMAC_ALGORITHM,
            $signatureHeader->timestamp . self::SIGNED_PAYLOAD_SEPARATOR . $payload,
            $secret,
        );
        if (!self::matchesAny($expected, $signatureHeader->signatures)) {
            throw new WebhookSignatureException(WebhookSignatureFailure::SignatureMismatch);
        }

        return WebhookEvent::fromArray(self::decode($payload));
    }

    private static function assertWithinTolerance(int $timestamp, int $now, int $toleranceSeconds): void
    {
        if (abs($now - $timestamp) > $toleranceSeconds) {
            throw new WebhookSignatureException(WebhookSignatureFailure::TimestampOutsideTolerance);
        }
    }

    /**
     * `hash_equals` compares in constant time, so the signatures never leak by timing.
     *
     * @param list<string> $signatures
     */
    private static function matchesAny(string $expected, array $signatures): bool
    {
        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<mixed>
     */
    private static function decode(string $payload): array
    {
        try {
            $event = json_decode($payload, true, self::JSON_MAX_DEPTH, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new WebhookSignatureException(WebhookSignatureFailure::InvalidPayload, $exception);
        }
        if (!is_array($event) || array_is_list($event)) {
            throw new WebhookSignatureException(WebhookSignatureFailure::InvalidPayload);
        }

        return $event;
    }
}
