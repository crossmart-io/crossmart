<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use Crossmart\Http\HttpStatus;
use JsonException;

/**
 * Builds the exception that matches an error response.
 *
 * The API answers errors in NestJS's shape, `{"statusCode", "message", "error"}`, where `message`
 * is a string or a list of validation messages, plus `code` and details on some errors such as
 * plan limits.
 */
final class ApiExceptionFactory
{
    private const MESSAGE_FIELD = 'message';
    private const CODE_FIELD = 'code';
    private const ERROR_FIELD = 'error';
    private const MESSAGE_SEPARATOR = '; ';
    private const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

    /** @var array<int, class-string<ApiException>> */
    private const EXCEPTIONS_BY_STATUS = [
        HttpStatus::BAD_REQUEST => BadRequestException::class,
        HttpStatus::UNAUTHORIZED => AuthenticationException::class,
        HttpStatus::PAYMENT_REQUIRED => PlanLimitException::class,
        HttpStatus::FORBIDDEN => PermissionDeniedException::class,
        HttpStatus::NOT_FOUND => NotFoundException::class,
        HttpStatus::CONFLICT => ConflictException::class,
        HttpStatus::TOO_MANY_REQUESTS => RateLimitException::class,
    ];

    /**
     * @param array<string, list<string>> $headers
     */
    public function create(int $status, string $content, ?string $reasonPhrase, array $headers): ApiException
    {
        $body = $this->decodeObject($content);
        $exceptionClass = $this->exceptionClass($status);

        return new $exceptionClass(
            $status,
            $this->message($body, $content, $reasonPhrase),
            $this->stringField($body, self::CODE_FIELD),
            $this->stringField($body, self::ERROR_FIELD) ?? $reasonPhrase,
            $body,
            $headers,
        );
    }

    /**
     * @return class-string<ApiException>
     */
    private function exceptionClass(int $status): string
    {
        if ($status >= HttpStatus::INTERNAL_SERVER_ERROR) {
            return ServerException::class;
        }

        return self::EXCEPTIONS_BY_STATUS[$status] ?? ApiException::class;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeObject(string $content): ?array
    {
        try {
            $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }
        if (!is_array($decoded) || array_is_list($decoded)) {
            return null;
        }
        $object = [];
        foreach ($decoded as $key => $value) {
            $object[(string) $key] = $value;
        }

        return $object;
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function message(?array $body, string $content, ?string $reasonPhrase): string
    {
        $message = $body[self::MESSAGE_FIELD] ?? null;
        if (is_array($message)) {
            return implode(self::MESSAGE_SEPARATOR, array_map(static fn (mixed $part): string => is_scalar($part) ? (string) $part : '', $message));
        }
        if (is_string($message) && $message !== '') {
            return $message;
        }
        $text = trim($content);

        return $text !== '' ? $text : ($reasonPhrase ?? self::UNKNOWN_ERROR_MESSAGE);
    }

    /**
     * @param array<string, mixed>|null $body
     */
    private function stringField(?array $body, string $field): ?string
    {
        $value = $body[$field] ?? null;

        return is_string($value) ? $value : null;
    }
}
