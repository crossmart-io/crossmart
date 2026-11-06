<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use UnexpectedValueException;

/**
 * JSON that does not match the API's schema: a response from an incompatible server, or a
 * request body given as an array with a missing or mistyped field.
 */
final class InvalidPayloadException extends UnexpectedValueException implements CrossmartExceptionInterface
{
    public static function missingField(string $field): self
    {
        return new self(sprintf('%s is missing.', $field));
    }

    public static function unexpectedType(string $field, string $expected, mixed $value): self
    {
        return new self(sprintf('%s should be %s, got %s.', $field, $expected, get_debug_type($value)));
    }

    public static function invalidJson(string $reason): self
    {
        return new self(sprintf('The API answered with invalid JSON: %s.', $reason));
    }
}
