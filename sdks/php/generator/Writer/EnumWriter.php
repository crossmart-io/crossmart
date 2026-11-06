<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Spec\Schema;
use Crossmart\Generator\Type\Imports;
use UnexpectedValueException;

/**
 * Writes a string schema with `enum` values as a backed enum.
 */
final class EnumWriter
{
    private const INDENT = '    ';

    public function __construct(
        private readonly NameFormatter $names,
        private readonly DocBlock $docBlock,
    ) {
    }

    public function write(string $name, Schema $schema): GeneratedFile
    {
        $body = [
            ...$this->docBlock->render([$schema->description()], []),
            sprintf('enum %s: string', $this->names->identifier($name)),
            '{',
            ...$this->cases($name, $schema->enumValues()),
            '}',
        ];

        return GeneratedFile::forClass(GeneratorConfig::ENUM_NAMESPACE, $name, new Imports(GeneratorConfig::ENUM_NAMESPACE), $body);
    }

    /**
     * @param list<string> $values
     *
     * @return list<string>
     */
    private function cases(string $enumName, array $values): array
    {
        $cases = [];
        foreach ($values as $value) {
            $case = $this->names->enumCase($value);
            if (isset($cases[$case])) {
                throw new UnexpectedValueException(sprintf('Two values of %s map to the case %s.', $enumName, $case));
            }
            $cases[$case] = sprintf('%scase %s = %s;', self::INDENT, $case, PhpLiteral::string($value));
        }

        return array_values($cases);
    }
}
