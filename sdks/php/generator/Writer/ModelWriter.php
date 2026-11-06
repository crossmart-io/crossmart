<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Spec\Schema;
use Crossmart\Generator\Type\Imports;
use Crossmart\Generator\Type\TypeResolver;

/**
 * Writes an object schema as an immutable model with `fromArray()` and `toArray()`.
 */
final class ModelWriter
{
    private const INDENT = '    ';
    private const DOUBLE_INDENT = '        ';
    private const TRIPLE_INDENT = '            ';

    public function __construct(
        private readonly TypeResolver $types,
        private readonly NameFormatter $names,
        private readonly DocBlock $docBlock,
    ) {
    }

    public function write(string $name, Schema $schema): GeneratedFile
    {
        $imports = new Imports(GeneratorConfig::MODEL_NAMESPACE);
        $properties = $this->properties($schema);
        $body = [
            ...$this->docBlock->render([$schema->description()], []),
            sprintf('final class %s implements %s', $this->names->identifier($name), $imports->use(GeneratorConfig::JSON_SERIALIZABLE_CLASS)),
            '{',
            ...$this->constructor($properties, $imports),
            '',
            ...$this->fromArray($properties, $imports),
            '',
            ...$this->toArray($properties, $imports),
            '',
            ...$this->jsonSerialize(),
            '}',
        ];

        return GeneratedFile::forClass(GeneratorConfig::MODEL_NAMESPACE, $name, $imports, $body);
    }

    /**
     * Required properties first, so that optional parameters come last.
     *
     * @return list<ModelProperty>
     */
    private function properties(Schema $schema): array
    {
        $required = $schema->required();
        $properties = [];
        foreach ($schema->properties() as $name => $property) {
            $properties[] = new ModelProperty(
                name: $this->names->identifier((string) $name),
                type: $this->types->resolve($property),
                required: in_array((string) $name, $required, true),
                nullable: $property->isNullable(),
                description: $property->description(),
            );
        }
        usort($properties, static fn (ModelProperty $left, ModelProperty $right): int => $right->required <=> $left->required);

        return $properties;
    }

    /**
     * @param list<ModelProperty> $properties
     *
     * @return list<string>
     */
    private function constructor(array $properties, Imports $imports): array
    {
        if ($properties === []) {
            return [self::INDENT . 'public function __construct()', self::INDENT . '{', self::INDENT . '}'];
        }
        $tags = array_values(array_filter(
            array_map(fn (ModelProperty $property): ?string => $property->paramTag($imports, $this->docBlock), $properties),
            static fn (?string $tag): bool => $tag !== null,
        ));

        return [
            ...$this->docBlock->render([], $tags, self::INDENT),
            self::INDENT . 'public function __construct(',
            ...array_map(static fn (ModelProperty $property): string => self::DOUBLE_INDENT . $property->parameter($imports) . ',', $properties),
            self::INDENT . ') {',
            self::INDENT . '}',
        ];
    }

    /**
     * @param list<ModelProperty> $properties
     *
     * @return list<string>
     */
    private function fromArray(array $properties, Imports $imports): array
    {
        $signature = [
            ...$this->docBlock->render(["Builds the model from the API's JSON shape."], ['@param array<string, mixed> $data'], self::INDENT),
            self::INDENT . 'public static function fromArray(array $data): self',
            self::INDENT . '{',
        ];
        if ($properties === []) {
            return [...$signature, self::DOUBLE_INDENT . 'return new self();', self::INDENT . '}'];
        }

        return [
            ...$signature,
            sprintf('%s$payload = new %s($data, self::class);', self::DOUBLE_INDENT, $imports->use(GeneratorConfig::PAYLOAD_CLASS)),
            '',
            self::DOUBLE_INDENT . 'return new self(',
            ...array_map(
                static fn (ModelProperty $property): string => sprintf('%s%s: %s,', self::TRIPLE_INDENT, $property->name, $property->decode($imports)),
                $properties,
            ),
            self::DOUBLE_INDENT . ');',
            self::INDENT . '}',
        ];
    }

    /**
     * @param list<ModelProperty> $properties
     *
     * @return list<string>
     */
    private function toArray(array $properties, Imports $imports): array
    {
        $required = array_filter($properties, static fn (ModelProperty $property): bool => $property->required);
        $optional = array_filter($properties, static fn (ModelProperty $property): bool => !$property->required);
        $lines = [
            ...$this->docBlock->render(["The model in the API's JSON shape."], ['@return array<string, mixed>'], self::INDENT),
            self::INDENT . 'public function toArray(): array',
            self::INDENT . '{',
        ];
        if ($optional === []) {
            return [...$lines, ...$this->arrayLiteral('return ', $required, $imports), self::INDENT . '}'];
        }

        $lines = [...$lines, ...$this->arrayLiteral('$data = ', $required, $imports)];
        foreach ($optional as $property) {
            array_push($lines, ...$this->optionalEntry($property, $imports));
        }

        return [...$lines, '', self::DOUBLE_INDENT . 'return $data;', self::INDENT . '}'];
    }

    /**
     * @param array<ModelProperty> $properties
     *
     * @return list<string>
     */
    private function arrayLiteral(string $prefix, array $properties, Imports $imports): array
    {
        if ($properties === []) {
            return [self::DOUBLE_INDENT . $prefix . '[];'];
        }

        return [
            self::DOUBLE_INDENT . $prefix . '[',
            ...array_values(array_map(
                static fn (ModelProperty $property): string => sprintf(
                    '%s%s => %s,',
                    self::TRIPLE_INDENT,
                    PhpLiteral::string($property->name),
                    $property->encode($imports),
                ),
                $properties,
            )),
            self::DOUBLE_INDENT . '];',
        ];
    }

    /**
     * @return list<string>
     */
    private function optionalEntry(ModelProperty $property, Imports $imports): array
    {
        $condition = $property->isUndefinable()
            ? sprintf('!$this->%s instanceof %s', $property->name, $imports->use(GeneratorConfig::UNDEFINED_CLASS))
            : sprintf('$this->%s !== null', $property->name);

        return [
            sprintf('%sif (%s) {', self::DOUBLE_INDENT, $condition),
            sprintf('%s$data[%s] = %s;', self::TRIPLE_INDENT, PhpLiteral::string($property->name), $property->encode($imports)),
            self::DOUBLE_INDENT . '}',
        ];
    }

    /**
     * @return list<string>
     */
    private function jsonSerialize(): array
    {
        return [
            ...$this->docBlock->render([], ['@return array<string, mixed>'], self::INDENT),
            self::INDENT . 'public function jsonSerialize(): array',
            self::INDENT . '{',
            self::DOUBLE_INDENT . 'return $this->toArray();',
            self::INDENT . '}',
        ];
    }
}
