<?php

declare(strict_types=1);

namespace Crossmart\Generator\Type;

use Crossmart\Generator\GeneratorConfig;
use LogicException;

/**
 * The PHP type of a schema, and the code that reads it from and writes it to JSON.
 */
final class PhpType
{
    private function __construct(
        public readonly TypeKind $kind,
        private readonly ?string $className = null,
        private readonly ?self $item = null,
    ) {
    }

    public static function scalar(TypeKind $kind): self
    {
        return new self($kind);
    }

    public static function enum(string $className): self
    {
        return new self(TypeKind::Enum, $className);
    }

    public static function model(string $className): self
    {
        return new self(TypeKind::Model, $className);
    }

    public static function listOf(self $item): self
    {
        return new self(TypeKind::List, item: $item);
    }

    public function item(): ?self
    {
        return $this->item;
    }

    public function native(Imports $imports): string
    {
        return match ($this->kind) {
            TypeKind::String => 'string',
            TypeKind::Number => 'int|float',
            TypeKind::Integer => 'int',
            TypeKind::Boolean => 'bool',
            TypeKind::DateTime => $imports->use(GeneratorConfig::DATE_TIME_CLASS),
            // A value added to the API after this SDK was generated arrives as a plain string.
            TypeKind::Enum => $imports->use($this->requireClassName()) . '|string',
            TypeKind::Model => $imports->use($this->requireClassName()),
            TypeKind::List, TypeKind::FreeForm => 'array',
        };
    }

    public function nullableNative(Imports $imports): string
    {
        $native = $this->native($imports);

        return str_contains($native, '|') ? $native . '|null' : '?' . $native;
    }

    /**
     * The PHPDoc type, or null when the native type already says everything.
     */
    public function doc(Imports $imports): ?string
    {
        return match ($this->kind) {
            TypeKind::List => sprintf('list<%s>', $this->requireItem()->doc($imports) ?? $this->requireItem()->native($imports)),
            TypeKind::FreeForm => 'array<string, mixed>',
            default => null,
        };
    }

    /**
     * The expression that reads the value at `$key` from a `Payload` named `$payload`.
     */
    public function decode(Imports $imports, string $key): string
    {
        return match ($this->kind) {
            TypeKind::String => sprintf('$payload->string(%s)', $key),
            TypeKind::Number => sprintf('$payload->number(%s)', $key),
            TypeKind::Integer => sprintf('$payload->int(%s)', $key),
            TypeKind::Boolean => sprintf('$payload->bool(%s)', $key),
            TypeKind::DateTime => sprintf('$payload->dateTime(%s)', $key),
            TypeKind::FreeForm => sprintf('$payload->object(%s)', $key),
            TypeKind::Enum => sprintf('$payload->enum(%s, %s::class)', $key, $this->className($imports)),
            TypeKind::Model => sprintf('$payload->model(%s, %s::fromArray(...))', $key, $this->className($imports)),
            TypeKind::List => $this->decodeList($imports, $key),
        };
    }

    /**
     * The expression that turns `$value` into its JSON form.
     */
    public function encode(Imports $imports, string $value, bool $nullable): string
    {
        $nullSafe = $nullable ? '?->' : '->';

        return match ($this->kind) {
            TypeKind::String, TypeKind::Number, TypeKind::Integer, TypeKind::Boolean, TypeKind::FreeForm => $value,
            TypeKind::Enum => sprintf('%s::enumValue(%s)', $imports->use(GeneratorConfig::PAYLOAD_CLASS), $value),
            TypeKind::Model => $value . $nullSafe . 'toArray()',
            TypeKind::DateTime => $this->orNull($value, $nullable, sprintf('%s::formatDateTime(%s)', $imports->use(GeneratorConfig::PAYLOAD_CLASS), $value)),
            TypeKind::List => $this->orNull($value, $nullable, $this->encodeList($imports, $value)),
        };
    }

    private function decodeList(Imports $imports, string $key): string
    {
        $item = $this->requireItem();

        return match ($item->kind) {
            TypeKind::String => sprintf('$payload->stringList(%s)', $key),
            TypeKind::Enum => sprintf('$payload->enumList(%s, %s::class)', $key, $item->className($imports)),
            TypeKind::Model => sprintf('$payload->modelList(%s, %s::fromArray(...))', $key, $item->className($imports)),
            default => throw new LogicException(sprintf('Lists of %s are not supported.', $item->kind->name)),
        };
    }

    private function encodeList(Imports $imports, string $value): string
    {
        $item = $this->requireItem();

        return match ($item->kind) {
            TypeKind::String => $value,
            TypeKind::Enum => sprintf('array_map(%s::enumValue(...), %s)', $imports->use(GeneratorConfig::PAYLOAD_CLASS), $value),
            TypeKind::Model => sprintf('array_map(static fn (%s $item): array => $item->toArray(), %s)', $item->native($imports), $value),
            default => throw new LogicException(sprintf('Lists of %s are not supported.', $item->kind->name)),
        };
    }

    /**
     * The short name of the enum or model class.
     */
    public function className(Imports $imports): string
    {
        return $imports->use($this->requireClassName());
    }

    private function orNull(string $value, bool $nullable, string $expression): string
    {
        if (!$nullable || $expression === $value) {
            return $expression;
        }

        return sprintf('%s === null ? null : %s', $value, $expression);
    }

    private function requireClassName(): string
    {
        return $this->className ?? throw new LogicException('The type has no class.');
    }

    private function requireItem(): self
    {
        return $this->item ?? throw new LogicException('The list has no item type.');
    }
}
