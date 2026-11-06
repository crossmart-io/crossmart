<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Type\Imports;
use Crossmart\Generator\Type\PhpType;

/**
 * A property of a generated model, and the code each of its uses needs.
 *
 * An optional property that is also nullable can be absent, `null`, or set. It defaults to
 * `Undefined::Value`, so a request can tell "leave it as it is" (absent) from "clear it" (null).
 */
final class ModelProperty
{
    public function __construct(
        public readonly string $name,
        public readonly PhpType $type,
        public readonly bool $required,
        public readonly bool $nullable,
        public readonly ?string $description,
    ) {
    }

    public function isUndefinable(): bool
    {
        return !$this->required && $this->nullable;
    }

    public function canBeNull(): bool
    {
        return $this->nullable || !$this->required;
    }

    public function parameter(Imports $imports): string
    {
        return match (true) {
            $this->isUndefinable() => sprintf(
                'public readonly %s|%s|null $%s = %s::Value',
                $this->type->native($imports),
                $imports->use(GeneratorConfig::UNDEFINED_CLASS),
                $this->name,
                $imports->use(GeneratorConfig::UNDEFINED_CLASS),
            ),
            $this->canBeNull() => sprintf(
                'public readonly %s $%s%s',
                $this->type->nullableNative($imports),
                $this->name,
                $this->required ? '' : ' = null',
            ),
            default => sprintf('public readonly %s $%s', $this->type->native($imports), $this->name),
        };
    }

    /**
     * The `@param` tag, or null when the signature already says everything.
     */
    public function paramTag(Imports $imports, DocBlock $docBlock): ?string
    {
        $docType = $this->type->doc($imports);
        if ($docType === null && $this->description === null) {
            return null;
        }
        $type = $docType ?? $this->type->native($imports);
        $suffix = match (true) {
            $this->isUndefinable() => '|' . $imports->use(GeneratorConfig::UNDEFINED_CLASS) . '|null',
            $this->canBeNull() => '|null',
            default => '',
        };

        return rtrim(sprintf('@param %s%s $%s %s', $type, $suffix, $this->name, $docBlock->inline($this->description)));
    }

    public function decode(Imports $imports): string
    {
        $key = PhpLiteral::string($this->name);
        $read = $this->type->decode($imports, $key);
        if ($this->isUndefinable()) {
            return sprintf(
                '!$payload->has(%s) ? %s::Value : ($payload->isNull(%s) ? null : %s)',
                $key,
                $imports->use(GeneratorConfig::UNDEFINED_CLASS),
                $key,
                $read,
            );
        }

        return $this->canBeNull() ? sprintf('$payload->isNull(%s) ? null : %s', $key, $read) : $read;
    }

    public function encode(Imports $imports): string
    {
        return $this->type->encode($imports, '$this->' . $this->name, $this->nullable);
    }
}
