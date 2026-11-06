<?php

declare(strict_types=1);

namespace Crossmart\Http;

use BackedEnum;
use Crossmart\Serialization\Payload;
use DateTimeInterface;
use InvalidArgumentException;

/**
 * Encodes query parameters the way the API reads them: lists repeat the name
 * (`tags=a&tags=b`), enums send their value and dates use ISO 8601.
 */
final class QueryString
{
    private const TRUE = 'true';
    private const FALSE = 'false';
    private const PAIR_SEPARATOR = '&';
    private const PAIR_FORMAT = '%s=%s';

    /**
     * @param array<string, mixed> $parameters
     */
    public static function encode(array $parameters): string
    {
        $pairs = [];
        foreach ($parameters as $name => $value) {
            foreach (self::values($value) as $item) {
                $pairs[] = sprintf(self::PAIR_FORMAT, rawurlencode($name), rawurlencode(self::scalar($item, $name)));
            }
        }

        return implode(self::PAIR_SEPARATOR, $pairs);
    }

    /**
     * @return list<mixed>
     */
    private static function values(mixed $value): array
    {
        if ($value === null) {
            return [];
        }

        return is_array($value) ? array_values($value) : [$value];
    }

    private static function scalar(mixed $value, string $name): string
    {
        return match (true) {
            $value instanceof BackedEnum => (string) $value->value,
            $value instanceof DateTimeInterface => Payload::formatDateTime($value),
            is_bool($value) => $value ? self::TRUE : self::FALSE,
            is_string($value), is_int($value), is_float($value) => (string) $value,
            default => throw new InvalidArgumentException(sprintf('The query parameter "%s" cannot be a %s.', $name, get_debug_type($value))),
        };
    }
}
