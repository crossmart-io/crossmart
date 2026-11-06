<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

use Crossmart\Exception\WebhookSignatureException;

/**
 * The parts of a `Crossmart-Signature: t=<unix seconds>,v1=<hex>[,v1=<hex>...]` header.
 *
 * @internal
 */
final class SignatureHeader
{
    private const ELEMENT_SEPARATOR = ',';
    private const KEY_VALUE_SEPARATOR = '=';
    private const TIMESTAMP_KEY = 't';
    private const SIGNATURE_SCHEME_V1 = 'v1';
    private const UNIX_TIMESTAMP_PATTERN = '/\A[0-9]+\z/';

    /**
     * @param string $timestamp The raw `t` value, signed exactly as sent.
     * @param non-empty-list<string> $signatures One, or two while the secret is being rotated.
     */
    private function __construct(
        public readonly string $timestamp,
        public readonly array $signatures,
    ) {
    }

    /**
     * Parses the header. Unknown schemes, such as `v0`, are ignored.
     *
     * @throws WebhookSignatureException
     */
    public static function parse(?string $header): self
    {
        if ($header === null || trim($header) === '') {
            throw new WebhookSignatureException(WebhookSignatureFailure::MissingHeader);
        }
        $timestamp = null;
        $signatures = [];
        foreach (explode(self::ELEMENT_SEPARATOR, $header) as $element) {
            [$key, $value] = self::splitElement($element);
            if ($key === self::TIMESTAMP_KEY) {
                $timestamp = $value;
            } elseif ($key === self::SIGNATURE_SCHEME_V1) {
                $signatures[] = $value;
            }
        }

        return new self(self::requireTimestamp($timestamp), self::requireSignatures($signatures));
    }

    /**
     * @return array{string, string}
     */
    private static function splitElement(string $element): array
    {
        $parts = explode(self::KEY_VALUE_SEPARATOR, $element, 2);
        if (count($parts) !== 2 || trim($parts[0]) === '') {
            throw new WebhookSignatureException(WebhookSignatureFailure::MalformedHeader);
        }

        return [trim($parts[0]), trim($parts[1])];
    }

    private static function requireTimestamp(?string $timestamp): string
    {
        if ($timestamp === null) {
            throw new WebhookSignatureException(WebhookSignatureFailure::MissingTimestamp);
        }
        if (preg_match(self::UNIX_TIMESTAMP_PATTERN, $timestamp) !== 1) {
            throw new WebhookSignatureException(WebhookSignatureFailure::InvalidTimestamp);
        }

        return $timestamp;
    }

    /**
     * @param list<string> $signatures
     *
     * @return non-empty-list<string>
     */
    private static function requireSignatures(array $signatures): array
    {
        if ($signatures === []) {
            throw new WebhookSignatureException(WebhookSignatureFailure::MissingSignature);
        }

        return $signatures;
    }
}
