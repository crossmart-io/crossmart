<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Crossmart\Config\Defaults;
use DateTimeImmutable;
use Exception;

/**
 * How the client retries failed idempotent requests: after a 429, a 5xx or a network failure,
 * with exponential backoff and jitter. A `Retry-After` header, in seconds or as an HTTP date,
 * sets the wait when present.
 */
final class RetryPolicy
{
    private const RETRYABLE_STATUSES = [
        HttpStatus::TOO_MANY_REQUESTS,
        HttpStatus::INTERNAL_SERVER_ERROR,
        HttpStatus::BAD_GATEWAY,
        HttpStatus::SERVICE_UNAVAILABLE,
        HttpStatus::GATEWAY_TIMEOUT,
    ];

    /**
     * @param int $maxRetries Retries after the first attempt. 0 disables retries.
     * @param float $initialBackoff Seconds before the first retry; each retry doubles it.
     * @param float $maxBackoff The longest wait between two attempts when the API gives no `Retry-After`.
     */
    public function __construct(
        public readonly int $maxRetries = Defaults::MAX_RETRIES,
        public readonly float $initialBackoff = Defaults::INITIAL_BACKOFF_SECONDS,
        public readonly float $maxBackoff = Defaults::MAX_BACKOFF_SECONDS,
    ) {
    }

    /**
     * Whether a request may be sent again after `$attempt` failed attempts.
     */
    public function allowsRetry(string $method, int $attempt): bool
    {
        return $attempt <= $this->maxRetries && (HttpMethod::tryFrom(strtoupper($method))?->isIdempotent() ?? false);
    }

    public function shouldRetryStatus(string $method, int $status, int $attempt): bool
    {
        return in_array($status, self::RETRYABLE_STATUSES, true) && $this->allowsRetry($method, $attempt);
    }

    /**
     * Seconds to wait before the next attempt.
     */
    public function delay(int $attempt, ?string $retryAfter = null): float
    {
        return $this->retryAfterSeconds($retryAfter) ?? $this->backoff($attempt);
    }

    private function backoff(int $attempt): float
    {
        $exponential = $this->initialBackoff * Defaults::BACKOFF_MULTIPLIER ** ($attempt - 1);
        $capped = min($exponential, $this->maxBackoff);
        $jitter = $capped * Defaults::BACKOFF_JITTER_RATIO * (mt_rand() / mt_getrandmax());

        return $capped - $jitter;
    }

    /**
     * The wait a `Retry-After` header asks for, capped, or null without a usable one.
     */
    private function retryAfterSeconds(?string $retryAfter): ?float
    {
        $value = trim($retryAfter ?? '');
        if ($value === '') {
            return null;
        }
        $seconds = is_numeric($value) ? (float) $value : $this->secondsUntil($value);

        return $seconds === null ? null : min(max($seconds, 0.0), Defaults::MAX_RETRY_AFTER_SECONDS);
    }

    private function secondsUntil(string $httpDate): ?float
    {
        try {
            $retryAt = new DateTimeImmutable($httpDate);
        } catch (Exception) {
            return null;
        }

        return (float) ($retryAt->getTimestamp() - time());
    }
}
