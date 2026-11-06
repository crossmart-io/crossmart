<?php

declare(strict_types=1);

namespace Crossmart\Serialization;

use BackedEnum;
use Crossmart\Exception\InvalidPayloadException;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Exception;

/**
 * Reads the fields of a JSON object with the types the API documents.
 *
 * The generated models use it in `fromArray()`. A field of the wrong type raises an
 * {@see InvalidPayloadException} that names the model and the field.
 */
final class Payload
{
    /** How dates are written to the API: ISO 8601 in UTC with milliseconds, as JavaScript does. */
    public const DATE_TIME_FORMAT = 'Y-m-d\TH:i:s.v\Z';
    private const UTC = 'UTC';

    private const NAMESPACE_SEPARATOR = '\\';

    private readonly string $modelName;

    /**
     * @param array<string, mixed> $data
     * @param string $modelClass The model being read, named in error messages.
     */
    public function __construct(
        private readonly array $data,
        string $modelClass,
    ) {
        $separator = strrpos($modelClass, self::NAMESPACE_SEPARATOR);
        $this->modelName = $separator === false ? $modelClass : substr($modelClass, $separator + 1);
    }

    public static function formatDateTime(DateTimeInterface $dateTime): string
    {
        return DateTimeImmutable::createFromInterface($dateTime)
            ->setTimezone(new DateTimeZone(self::UTC))
            ->format(self::DATE_TIME_FORMAT);
    }

    /**
     * The JSON value of an enum field: the case's value, or the string kept for a value this
     * version of the SDK does not know.
     */
    public static function enumValue(BackedEnum|string|null $value): int|string|null
    {
        return $value instanceof BackedEnum ? $value->value : $value;
    }

    /**
     * A decoded JSON object, with string keys.
     *
     * @return array<string, mixed>
     */
    public static function toObject(mixed $value, string $context): array
    {
        if (!is_array($value) || (array_is_list($value) && $value !== [])) {
            throw InvalidPayloadException::unexpectedType($context, 'an object', $value);
        }
        $object = [];
        foreach ($value as $key => $field) {
            $object[(string) $key] = $field;
        }

        return $object;
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->data);
    }

    /**
     * Whether the field is absent or null.
     */
    public function isNull(string $key): bool
    {
        return ($this->data[$key] ?? null) === null;
    }

    public function string(string $key): string
    {
        $value = $this->value($key);

        return is_string($value) ? $value : throw $this->unexpected($key, 'a string', $value);
    }

    public function number(string $key): int|float
    {
        $value = $this->value($key);

        return is_int($value) || is_float($value) ? $value : throw $this->unexpected($key, 'a number', $value);
    }

    public function int(string $key): int
    {
        $value = $this->value($key);

        return is_int($value) ? $value : throw $this->unexpected($key, 'an integer', $value);
    }

    public function bool(string $key): bool
    {
        $value = $this->value($key);

        return is_bool($value) ? $value : throw $this->unexpected($key, 'a boolean', $value);
    }

    public function dateTime(string $key): DateTimeImmutable
    {
        $value = $this->string($key);
        try {
            return new DateTimeImmutable($value);
        } catch (Exception) {
            throw $this->unexpected($key, 'a date and time', $value);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function object(string $key): array
    {
        return self::toObject($this->value($key), $this->context($key));
    }

    /**
     * The enum case, or the plain string when the API sends a value added after this SDK was
     * generated, so that new values never break existing code.
     *
     * @template T of BackedEnum
     *
     * @param class-string<T> $enum
     *
     * @return T|string
     */
    public function enum(string $key, string $enum): BackedEnum|string
    {
        return $this->toEnum($this->string($key), $enum);
    }

    /**
     * @template T
     *
     * @param callable(array<string, mixed>): T $factory
     *
     * @return T
     */
    public function model(string $key, callable $factory): mixed
    {
        return $factory($this->object($key));
    }

    /**
     * @return list<string>
     */
    public function stringList(string $key): array
    {
        return array_map(
            fn (mixed $item): string => is_string($item) ? $item : throw $this->unexpected($key, 'a list of strings', $item),
            $this->list($key),
        );
    }

    /**
     * @template T of BackedEnum
     *
     * @param class-string<T> $enum
     *
     * @return list<T|string>
     */
    public function enumList(string $key, string $enum): array
    {
        return array_map(
            fn (mixed $item): BackedEnum|string => is_string($item) ? $this->toEnum($item, $enum) : throw $this->unexpected($key, 'a list of strings', $item),
            $this->list($key),
        );
    }

    /**
     * @template T
     *
     * @param callable(array<string, mixed>): T $factory
     *
     * @return list<T>
     */
    public function modelList(string $key, callable $factory): array
    {
        return array_map(
            fn (mixed $item): mixed => $factory(self::toObject($item, $this->context($key))),
            $this->list($key),
        );
    }

    /**
     * @return list<mixed>
     */
    private function list(string $key): array
    {
        $value = $this->value($key);

        return is_array($value) && array_is_list($value) ? $value : throw $this->unexpected($key, 'a list', $value);
    }

    /**
     * @template T of BackedEnum
     *
     * @param class-string<T> $enum
     *
     * @return T|string
     */
    private function toEnum(string $value, string $enum): BackedEnum|string
    {
        return $enum::tryFrom($value) ?? $value;
    }

    private function value(string $key): mixed
    {
        if (!$this->has($key)) {
            throw InvalidPayloadException::missingField($this->context($key));
        }

        return $this->data[$key];
    }

    private function unexpected(string $key, string $expected, mixed $value): InvalidPayloadException
    {
        return InvalidPayloadException::unexpectedType($this->context($key), $expected, $value);
    }

    private function context(string $key): string
    {
        return $this->modelName . '.' . $key;
    }
}
