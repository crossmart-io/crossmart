<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use RuntimeException;

/**
 * The API answered with an error status. Subclasses cover the statuses callers usually handle
 * differently; {@see getStatus()} is also the exception code.
 */
class ApiException extends RuntimeException implements CrossmartExceptionInterface
{
    private readonly string $apiMessage;

    /**
     * @param array<string, mixed>|null $body The decoded JSON body, or null when it was not JSON.
     * @param array<string, list<string>> $headers The response headers.
     */
    final public function __construct(
        private readonly int $status,
        string $message,
        private readonly ?string $errorCode = null,
        private readonly ?string $reasonPhrase = null,
        private readonly ?array $body = null,
        private readonly array $headers = [],
    ) {
        parent::__construct(sprintf('%d %s', $status, $message), $status);
        $this->apiMessage = $message;
    }

    /** The HTTP status code, such as 404. */
    public function getStatus(): int
    {
        return $this->status;
    }

    /** What went wrong, as the API explains it. Validation messages are joined with "; ". */
    public function getApiMessage(): string
    {
        return $this->apiMessage;
    }

    /**
     * A machine-readable reason when the API gives one, such as `plan_limit_reached`. Compare it
     * with the values of {@see \Crossmart\Enum\EntitlementErrorCode} or
     * {@see \Crossmart\Enum\ListingRetryErrorCode}.
     */
    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    /** The HTTP reason phrase the API sent, such as "Not Found". */
    public function getReasonPhrase(): ?string
    {
        return $this->reasonPhrase;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getBody(): ?array
    {
        return $this->body;
    }

    /**
     * @return array<string, list<string>>
     */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    protected function bodyString(string $field): ?string
    {
        $value = $this->body[$field] ?? null;

        return is_string($value) ? $value : null;
    }

    protected function bodyInt(string $field): ?int
    {
        $value = $this->body[$field] ?? null;

        return is_int($value) || is_float($value) ? (int) $value : null;
    }
}
