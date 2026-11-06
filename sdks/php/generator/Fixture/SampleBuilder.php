<?php

declare(strict_types=1);

namespace Crossmart\Generator\Fixture;

use Crossmart\Generator\Spec\OpenApiType;
use Crossmart\Generator\Spec\Schema;
use UnexpectedValueException;

/**
 * Builds the smallest valid instance of a schema: every required property gets a placeholder of
 * the right type, and nullable nested objects get null so the tests cover nullable models.
 */
final class SampleBuilder
{
    private const SAMPLE_UUID = '00000000-0000-4000-8000-000000000001';
    private const SAMPLE_DATE_TIME = '2026-01-01T00:00:00.000Z';
    private const SAMPLE_STRING = 'sample';
    private const SAMPLE_NUMBER = 1;
    private const STRING_SAMPLES = [
        OpenApiType::FORMAT_UUID => self::SAMPLE_UUID,
        OpenApiType::FORMAT_DATE_TIME => self::SAMPLE_DATE_TIME,
    ];

    /**
     * @param array<string, Schema> $components
     */
    public function __construct(private readonly array $components)
    {
    }

    public function build(Schema $schema): mixed
    {
        $reference = $schema->referencedName();
        if ($reference !== null) {
            return $schema->isNullable() ? null : $this->build($this->component($reference));
        }
        if ($schema->isEnum()) {
            return $schema->enumValues()[0] ?? null;
        }
        if ($schema->isObject()) {
            return $this->buildObject($schema);
        }

        return $this->buildScalar($schema);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildObject(Schema $schema): array
    {
        $properties = $schema->properties();
        $sample = [];
        foreach ($schema->required() as $name) {
            $sample[$name] = isset($properties[$name]) ? $this->build($properties[$name]) : null;
        }

        return $sample;
    }

    private function buildScalar(Schema $schema): mixed
    {
        return match ($schema->type()) {
            OpenApiType::ARRAY => [],
            OpenApiType::NUMBER, OpenApiType::INTEGER => self::SAMPLE_NUMBER,
            OpenApiType::BOOLEAN => true,
            default => self::STRING_SAMPLES[$schema->format() ?? ''] ?? self::SAMPLE_STRING,
        };
    }

    private function component(string $name): Schema
    {
        return $this->components[$name] ?? throw new UnexpectedValueException(sprintf('Unknown schema "%s".', $name));
    }
}
