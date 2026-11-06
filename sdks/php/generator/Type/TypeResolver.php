<?php

declare(strict_types=1);

namespace Crossmart\Generator\Type;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Spec\OpenApiType;
use Crossmart\Generator\Spec\Schema;
use UnexpectedValueException;

/**
 * Maps the schemas of the OpenAPI document to PHP types.
 */
final class TypeResolver
{
    private const SCALAR_KINDS = [
        OpenApiType::STRING => TypeKind::String,
        OpenApiType::NUMBER => TypeKind::Number,
        OpenApiType::INTEGER => TypeKind::Integer,
        OpenApiType::BOOLEAN => TypeKind::Boolean,
    ];

    /**
     * @param array<string, Schema> $components
     */
    public function __construct(private readonly array $components)
    {
    }

    public function resolve(Schema $schema): PhpType
    {
        $reference = $schema->referencedName();
        if ($reference !== null) {
            return $this->component($reference);
        }
        if ($schema->isArray()) {
            $items = $schema->items() ?? throw new UnexpectedValueException('An array schema has no items.');

            return PhpType::listOf($this->resolve($items));
        }
        if ($schema->isObject()) {
            return PhpType::scalar(TypeKind::FreeForm);
        }

        return $this->scalar($schema);
    }

    public function isEnum(string $name): bool
    {
        return isset($this->components[$name]) && $this->components[$name]->isEnum();
    }

    private function component(string $name): PhpType
    {
        if (!isset($this->components[$name])) {
            throw new UnexpectedValueException(sprintf('Unknown schema "%s".', $name));
        }

        return $this->isEnum($name)
            ? PhpType::enum(GeneratorConfig::ENUM_NAMESPACE . '\\' . $name)
            : PhpType::model(GeneratorConfig::MODEL_NAMESPACE . '\\' . $name);
    }

    private function scalar(Schema $schema): PhpType
    {
        $type = $schema->type() ?? OpenApiType::STRING;
        if ($type === OpenApiType::STRING && $schema->format() === OpenApiType::FORMAT_DATE_TIME) {
            return PhpType::scalar(TypeKind::DateTime);
        }

        return PhpType::scalar(self::SCALAR_KINDS[$type] ?? throw new UnexpectedValueException(sprintf('Unsupported type "%s".', $type)));
    }
}
